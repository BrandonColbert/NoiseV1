import {app, BrowserWindow, screen, session} from "electron"
// import "source-map-support/register"

async function start(): Promise<void> {
	app.allowRendererProcessReuse = true
	await app.whenReady()

	let {width, height} = screen.getPrimaryDisplay().workAreaSize
	let window = new BrowserWindow({
		icon: `resources/icons/icon.png`,
		width: width * 0.52,
		height: height * 0.75,
		minWidth: 750,
		minHeight: 350,
		frame: false,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			webviewTag: true
		}
	})

	window.removeMenu()
	window.loadFile("html/index.html")
	window.once("ready-to-show", () => window.show())

	const [{ElectronBlocker}, {fetch}] = [require("@cliqz/adblocker-electron"), require("cross-fetch")]
	const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
	blocker.enableBlockingInSession(session.defaultSession)

	// session.defaultSession.loadExtension("C:\\Users\\Dash\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\cjpalhdlnbpafiamejdnhcphjbkeiagm\\1.26.0_1")
}

start()