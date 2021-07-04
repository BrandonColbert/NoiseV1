import {WebviewTag} from "electron"
import Player from "../../core/player.js"
import View from "../view.js"

export default class PlayerView implements View {
	public readonly element: WebviewTag
	#player: Player

	public constructor(element: WebviewTag) {
		this.element = element
	}

	public get player(): Player {
		return this.#player
	}

	public deconstruct(): void {
		this.element.src = "about:blank"
	}

	/**
	 * Attempt to navigate to the specified URL
	 * 
	 * On success, the player will exists; on fail, an exception will be thrown
	 * @param url Address to load in the player
	 */
	public async navigate(url?: string): Promise<void> {
		if(!url) {
			this.#player = null
			await this.element.loadURL("about:blank")

			return
		}

		await this.element.loadURL(url)

		this.#player = await Player.for(this.element)

		if(!this.#player)
			throw new Error(`No player found for '${url}'`)

		await this.#player.bind()
	}
}