import {app, BrowserWindow, screen, protocol} from "electron"
import {promises as fs} from "fs"
import path from "path"
import Courier from "./core/courier.js"
import Noise from "./core/noise.js"
import Player from "./core/player.js"
import Playlist from "./core/playlist.js"

const appScheme: Electron.CustomScheme = {
	scheme: "app",
	privileges: {
		standard: true,
		secure: true,
		supportFetchAPI: true,
		corsEnabled: true,
		bypassCSP: true
	}
}

protocol.registerSchemesAsPrivileged([appScheme])

/**
 * Ensures the presence of configuration directories and files
 */
async function ensure(): Promise<void> {
	//Ensure directories exist
	let paths = [
		Noise.Paths.extensions,
		Noise.Paths.config,
		Courier.path,
		Player.path,
		Playlist.path
	]

	for(let path of paths) {
		try {
			await fs.access(path)
		} catch {
			await fs.mkdir(path)
		}
	}

	//Ensure settings exists
	try {
		await fs.access(Noise.Paths.settings)
	} catch {
		await fs.copyFile(`${Noise.Paths.resources}/data/settings.json`, Noise.Paths.settings)
	}
}

async function loadExtensions(): Promise<void> {
	//Load extensions
	for(let dirent of await fs.readdir(Noise.Paths.extensions, {withFileTypes: true})) {
		if(!dirent.isDirectory()) {
			console.error(`Extension ${dirent.name} is not a directory!`)
			continue
		}

		try {
			await fs.access(`${Noise.Paths.extensions}/${dirent.name}/package.json`)
		} catch {
			console.error(`Extension '${dirent.name}' is missing package.json!`)
			continue
		}

		require(`${Noise.Paths.extensions}/${dirent.name}`)
		console.log(`Loaded extension: ${dirent.name}`)
	}
}

//Setup process
;(async function(): Promise<void> {
	//Ensure config exists
	await ensure()

	//Prepare
	app.allowRendererProcessReuse = true
	await app.whenReady()

	//Special file protocol to app directory
	protocol.registerFileProtocol(appScheme.scheme, (request, callback) => {
		let url = request.url.slice(`${appScheme.scheme}://`.length);
		let newUrl = path.normalize(`${__dirname}/../${url}`)

		callback({path: newUrl})
	})

	//Create window
	let scale = screen.getPrimaryDisplay().scaleFactor

	let window = new BrowserWindow({
		icon: "app/resources/icons/icon.png",
		backgroundColor: (await Noise.getSettings()).theme.background,
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
			// worldSafeExecuteJavaScript: false,
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
			const {default: Noise} = require("./js/core/noise.js")
			const {default: Titlebar} = require("./js/ui/titlebar.js")

			Noise.applyTheme()
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

	await loadExtensions()
})()