import {WebviewTag} from "electron"
import Player from "../../core/player.js"

export default class PlayerView implements View {
	public readonly element: WebviewTag
	#player: Player = null

	public constructor(element: WebviewTag) {
		this.element = element
	}

	public get player(): Player {
		return this.#player
	}

	public destroy(): void {
		this.element.src = "about:blank"
	}

	public async navigate(url: string = null): Promise<void> {
		if(!url) {
			this.#player = null
			await this.element.loadURL("about:blank")

			return
		}

		await this.element.loadURL(url)

		this.#player = await Player.for(this.element)
		await this.#player.bind()
	}
}