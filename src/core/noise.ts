import {app, remote} from "electron"
import {promises as fs} from "fs"
import path from "path"
import Courier from "./courier.js"
import Player from "./player.js"
import Playlist from "./playlist.js"

export class Noise {
	public static async getSettings(): Promise<Noise.Settings> {
		let data = await fs.readFile(Noise.Paths.settings, "utf8")
		return JSON.parse(data) as Noise.Settings
	}

	public static async setSettings(value: Noise.Settings): Promise<void> {
		await fs.writeFile(
			Noise.Paths.settings,
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

	/**
	 * Ensures the presence of configuration directories and files
	 */
	public static async ensure(): Promise<void> {
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
}

export namespace Noise {
	export class Paths {
		/**
		 * Directory containing the executable or project
		 */
		public static get application(): string {
			return process.env.PORTABLE_EXECUTABLE_DIR
				?? app?.getAppPath()
				?? remote?.app?.getAppPath()
		}

		/**
		 * Directory to the externally bundled resources
		 */
		public static get resources(): string {
			if(process.mainModule.filename.indexOf("app.asar") == -1)
				return "."

			return path.join(process.resourcesPath, "app/resources")
		}

		public static get config(): string {
			return `${Noise.Paths.application}/config`
		}

		public static get extensions(): string {
			return `${Noise.Paths.application}/extensions`
		}

		public static get settings(): string {
			return `${Noise.Paths.config}/settings.json`
		}
	}

	export interface Settings {
		theme: Settings.Theme
	
		/** Default courier to use when adding a new media query */
		defaultCourier: string
	
		/** Duration in milliseconds to remember Accumulator search times */
		recency: number
	
		/** Maximum number of Accumulator searches within recency seconds before waiting */
		thresholdWait: number
	
		/** Maximum number of Accumulator searches within recency seconds before aborting */
		thresholdAbort: number
	}

	export namespace Settings {
		export interface Theme {
			accent: string
			"accent-variant": string
			background: string
			foreground: string
			"foreground-variant": string
			primary: string
			"primary-variant": string
			text: string
		}
	}
}

export default Noise