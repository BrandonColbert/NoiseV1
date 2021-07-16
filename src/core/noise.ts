import {app, remote} from "electron"
import {promises as fs} from "fs"
import path from "path"

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
		let settings = await Noise.getSettings()

		//Modify root colors according to theme values
		for(let [key, value] of Object.entries(settings.theme))
			document.documentElement.style.setProperty(`--color-${key}`, value)
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
			if(require.main && require.main.filename.indexOf("app.asar") == -1)
				return "app/resources"

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
		fetching: Settings.Fetching
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

		export interface Fetching {
			/** Duration in milliseconds to remember search times */
			recency: number

			/** Maximum number of searches within 'recency' seconds before waiting */
			thresholdWait: number

			/** Maximum number of searches within 'recency' seconds before aborting */
			thresholdAbort: number
		}
	}
}

export default Noise