import {app, BrowserWindow, screen, protocol} from "electron"
import {promises as fs} from "fs"
import path from "path"
import Noise from "./core/noise.js"

const AppScheme: Electron.CustomScheme = {
	scheme: "app",
	privileges: {
		standard: true,
		secure: true,
		supportFetchAPI: true,
		corsEnabled: true,
		bypassCSP: true
	}
}

protocol.registerSchemesAsPrivileged([AppScheme])

//Setup process
;(async function(): Promise<void> {
	//Prepare
	app.allowRendererProcessReuse = true
	await app.whenReady()

	//Special file protocol to app directory
	protocol.registerFileProtocol(AppScheme.scheme, (request, callback) => {
		let url = request.url.slice(`${AppScheme.scheme}://`.length);
		let newUrl = path.normalize(`${__dirname}/../${url}`)

		callback({path: newUrl})
	})

	//Create window
	let scale = screen.getPrimaryDisplay().scaleFactor

	let window = new BrowserWindow({
		icon: `app/resources/icons/icon.png`,
		width: 1200 / scale,
		height: 750 / scale,
		minWidth: 750,
		minHeight: 350,
		frame: false,
		show: false,
		fullscreenable: false,
		webPreferences: {
			zoomFactor: 1 / scale,
			contextIsolation: false,
			nodeIntegration: true,
			enableRemoteModule: true,
			webviewTag: true
		}
	})

	window.removeMenu()
	window.once("ready-to-show", () => window.show())

	//Display titlebar each time html is loaded
	window.webContents.on("did-finish-load", () => 
		window.webContents.executeJavaScript(`
			const {remote} = require("electron")
			const {default: Titlebar} = require('./js/ui/titlebar.js')

			new Titlebar().show()

			window.addEventListener("mousedown", event => {
				switch(event.button) {
					case 3:
						remote.getCurrentWindow().webContents.goBack()
						break
					case 4:
						remote.getCurrentWindow().webContents.goForward()
						break
				}
			})
		`)
	)

	//Enable application-wide keybinds
	window.webContents.on("before-input-event", (_, input) => {
		if(input.type != "keyDown" || input.isAutoRepeat)
			return

		switch(input.key.toLowerCase()) {
			case "i": //Open dev tools
				if(!input.control || !input.shift)
					break		
		
				window.webContents.toggleDevTools()
				break
			case "f12": //Open dev tools
				window.webContents.toggleDevTools()
				break
			case "r": //Reload window
				if(!input.control)
					break

				window.reload()
				break
			case "f5": //Reload window
				window.reload()
				break
		}
	})

	//Display home window
	await window.loadFile("app/home.html")

	//Load extensions
	let extensionPath = `${Noise.rootDirectory}\\extensions`

	for(let dirent of await fs.readdir(extensionPath, {withFileTypes: true})) {
		if(!dirent.isDirectory()) {
			console.error(`Extension ${dirent.name} is not a directory!`)
			continue
		}

		try {
			await fs.access(`${extensionPath}/${dirent.name}/package.json`)
		} catch {
			console.error(`Extension '${dirent.name}' is missing package.json!`)
			continue
		}

		require(`${extensionPath}/${dirent.name}`)
		console.log(`Loaded extension: ${dirent.name}`)
	}
})()