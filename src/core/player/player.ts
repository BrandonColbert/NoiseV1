import fs from "fs"
import Info from "./info.js"
import Noise from "../noise.js"
import Replicate from "../../utils/replicate.js"
import Selectors from "./selectors.js"

/**
 * Provides element selectors for compatible websites
 */
export default class Player {
	#info: Info

	protected constructor(info: Info) {
		this.#info = info
	}

	/** Display name */
	get name(): string {
		return this.#info.name
	}

	/** Regex to check for compatible website */
	get site(): RegExp {
		return new RegExp(this.#info.site, "g")
	}

	/** Whether media immediately plays on site load */
	get autoplay(): boolean {
		return this.#info.autoplay ?? false
	}

	/** Query selectors for page elements */
	get selectors(): Selectors {
		return Replicate.clone(this.#info.selectors)
	}

	get info(): Info {
		return Replicate.clone(this.#info)
	}

	/** Directory where players are kept */
	static get location(): string {
		return `${Noise.location}\\players`
	}
	
	/**
	 * @param url Url containing the media
	 * @return Whether interaction with the page is possible
	 */
	compatible(url: string): boolean {
		return url.match(this.site) != null
	}

	/**
	 * @param url Url to find compatible player
	 * @returns New player instance compatible with the url
	 */
	static async for(url: string): Promise<Player> {
		for(let filename of await fs.promises.readdir(Player.location)) {
			let player = new Player(JSON.parse(await fs.promises.readFile(`${location}\\${filename}`, "utf8")))

			if(player.compatible(url))
				return player
		}

		return null
	}
}