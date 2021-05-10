import Player from "../player.js";
const {remote} = require("electron")

/**
 * Enables player interaction
 */
export default class PlayerView extends Player {
	/** @type {Electron.WebviewTag} */
	#viewElement

	/** @type {Electron.WebContents} */
	#webContents

	/**
	 * 
	 * @param {Player} player Source player
	 * @param {Electron.WebviewTag} view Web view element 
	 */
	constructor(player, view) {
		super(player.info)
		this.#viewElement = view
		this.#webContents = null
	}

	/**
	 * Whether audio is playing
	 * @returns {boolean}
	 */
	get audible() {
		return this.#viewElement.isCurrentlyAudible()
	}

	/**
	 * Video/audio volume
	 * @param {number} value Volume from 0 to 1
	 */
	set volume(value) {
		this.#execute(`[...document.querySelectorAll("video"), ...document.querySelectorAll("audio")].forEach(e => e.volume = ${value})`)
	}

	/**
	 * Goes to the url
	 * @param {string} url Page url to go to
	 * @returns {Promise.<void>} Resolved when loading finishes
	 */
	async goto(url) {
		await new Promise(resolve => {
			this.#viewElement.addEventListener(
				"did-stop-loading",
				e => {
					this.#webContents = remote.webContents.fromId(e.target.getWebContentsId())
					resolve()
				},
				{once: true}
			)

			this.#viewElement.src = url
		})
	}

	/**
	 * Toggles the media playing
	 * @returns {Promise.<void>} Resolved when click is pressed
	 */
	async togglePlay() {
		await this.#execute(`document.querySelector("${this.selectors.togglePlay}").click()`)
	}

	/**
	 * Elapsed time
	 * @returns {Promise.<string>}
	 */
	async elapsed() {
		return this.#execute(`document.querySelector("${this.selectors.elapsed}").textContent`)
	}

	/**
	 * Duration
	 * @returns {Promise.<string>}
	 */
	async duration() {
		return this.#execute(`document.querySelector("${this.selectors.duration}").textContent`)
	}

	/**
	 * Elapsed time and duration
	 * @returns {Promise.<string[]>}
	 */
	async status() {
		return this.#execute(`[document.querySelector("${this.selectors.elapsed}").textContent, document.querySelector("${this.selectors.duration}").textContent]`)
	}

	/**
	 * @param {string} code 
	 * @returns {Promise}
	 */
	#execute = async code => this.#webContents.executeJavaScript(code, true)
}