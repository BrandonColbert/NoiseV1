import fs from "fs"
import {remote} from "electron"
import Courier from "./courier/courier.js"
import Player from "./player/player.js"
import Playlist from "./playlist/playlist.js"
import Settings from "./settings.js"
import Replicate from "../utils/replicate.js"

/**
 * Manages settings
 */
export default class Noise {
	private static _settings: Settings

	/** Directory where configuration info is kept */
	static get location(): string {
		return `${process.env.PORTABLE_EXECUTABLE_DIR ?? remote.app.getAppPath()}\\config`
	}

	static get settings(): Settings {
		return Replicate.clone(Noise._settings)
	}

	static async setSettings(value: Settings): Promise<void> {
		Noise._settings = value
		await fs.promises.writeFile(Noise.path, JSON.stringify(value, null, "\t"))
	}

	/** Path to settings */
	private static get path(): string {
		return `${Noise.location}\\settings.json`
	}

	private static init = (() => {
		//Ensure directories exist
		Array.from([
			Noise.location,
			`${Noise.location}\\playlists`,
			`${Noise.location}\\couriers`,
			`${Noise.location}\\players`
		]).forEach(e => {
			if(fs.existsSync(e))
				return

			fs.mkdirSync(e)
		})

		//Ensure settings exists
		if(!fs.existsSync(Noise.path))
			fs.writeFileSync(Noise.path, JSON.stringify(Noise.settings))

		Noise._settings = {
			defaultCourier: "",
			playlistOrder: [],
			recency: 5000,
			thresholdWait: 5,
			thresholdAbort: 50
		}
	})()
}