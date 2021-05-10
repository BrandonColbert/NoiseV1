import {WebContents, WebviewTag, remote} from "electron"
import Player from "../core/player/player.js"

/**
 * Enables player interaction
 */
export default class PlayerView extends Player {
	#viewElement: WebviewTag
	#webContents: WebContents

	constructor(player: Player, view: WebviewTag) {
		super(player.info)
		this.#viewElement = view
		this.#webContents = null
	}

	/** Whether audio is playing */
	get audible(): boolean {
		return this.#viewElement.isCurrentlyAudible()
	}

	/**
	 * Video/audio volume
	 * @param value Volume from 0 to 1
	 */
	set volume(value: number) {
		this.#execute(`[...document.querySelectorAll("video"), ...document.querySelectorAll("audio")].forEach(e => e.volume = ${value})`)
	}

	/**
	 * Goes to the url
	 * @param url Page url to go to
	 * @returns Resolved when loading finishes
	 */
	async goto(url: string): Promise<void> {
		await new Promise(resolve => {
			this.#viewElement.addEventListener(
				"did-stop-loading",
				e => {
					let target = e.target as WebviewTag
					this.#webContents = remote.webContents.fromId(target.getWebContentsId())
					resolve()
				},
				{once: true} as any
			)

			this.#viewElement.src = url
		})
	}

	/**
	 * Toggles the media playing
	 * @returns Resolved when click is pressed
	 */
	async togglePlay(): Promise<void> {
		await this.#execute(`document.querySelector("${this.selectors.togglePlay}").click()`)
	}

	/**
	 * Elapsed time
	 */
	async elapsed(): Promise<string> {
		return this.#execute(`document.querySelector("${this.selectors.elapsed}").textContent`)
	}

	/**
	 * Duration
	 */
	async duration(): Promise<string> {
		return this.#execute(`document.querySelector("${this.selectors.duration}").textContent`)
	}

	/**
	 * @returns Elapsed time and duration
	 */
	async status(): Promise<string[]> {
		return this.#execute(`[document.querySelector("${this.selectors.elapsed}").textContent, document.querySelector("${this.selectors.duration}").textContent]`)
	}

	#execute = async (code: string) => this.#webContents.executeJavaScript(code, true)
}