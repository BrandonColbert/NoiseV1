import {app, remote} from "electron"
import {promises as fs} from "fs"

export default class Noise {
	/**
	 * Directory where the executable or project is contained
	 */
	public static get rootDirectory(): string {
		return process.env.PORTABLE_EXECUTABLE_DIR
			?? app?.getAppPath()
			?? remote?.app?.getAppPath()
	}

	private static get settingsPath(): string {
		return `${Noise.rootDirectory}\\config\\settings.json`
	}

	public static async getSettings(): Promise<Settings> {
		let data = await fs.readFile(Noise.settingsPath, "utf8")
		return JSON.parse(data) as Settings
	}

	public static async setSettings(value: Settings): Promise<void> {
		await fs.writeFile(
			Noise.settingsPath,
			JSON.stringify(value, null, "\t"),
			"utf8"
		)
	}

	/**
	 * Applies the configured theme to the current document
	 */
	public static async applyTheme(): Promise<void> {
		//Get theme from settings
		let settings = await Noise.getSettings()
		let theme = settings?.theme

		//Do nothing if no theme present
		if(!theme)
			return

		let style = document.documentElement.style

		//Modify CSS custom colors according to theme values
		for(let [key, value] of Object.entries(theme))
			style.setProperty(`--color-${key}`, value)
	}

	private static init = (async () => {
		//Ensure directories exist
		let paths = Array.from([
			`${Noise.rootDirectory}\\config`,
			`${Noise.rootDirectory}\\config\\couriers`,
			`${Noise.rootDirectory}\\config\\players`,
			`${Noise.rootDirectory}\\extensions`,
			`${Noise.rootDirectory}\\playlists`
		])

		for(let path of paths) {
			try {
				await fs.access(path)
			} catch {
				await fs.mkdir(path)
			}
		}

		//Ensure settings exists
		try {
			await fs.access(Noise.settingsPath)
		} catch {
			await fs.copyFile("app/resources/data/settings.json", Noise.settingsPath)
		}
	})()
}

interface Settings {
	theme: Theme

	/** Default courier to use when adding a new media query */
	defaultCourier: string

	/** Duration in milliseconds to remember Accumulator search times */
	recency: number

	/** Maximum number of Accumulator searches within recency seconds before waiting */
	thresholdWait: number

	/** Maximum number of Accumulator searches within recency seconds before aborting */
	thresholdAbort: number
}

interface Theme {
	accent: string
	"accent-variant": string
	background: string
	foreground: string
	"foreground-variant": string
	primary: string
	"primary-variant": string
	text: string
}