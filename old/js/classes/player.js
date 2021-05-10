/**
 * Provides element selectors for compatible websites
 */
export default class Player {
	/** @type {string} */
	#name

	/** @type {string} */
	#site

	/** @type {boolean} */
	#autoplay

	/** @type {Selectors} */
	#selectors

	/**
	 * @param {Info} info
	 */
	constructor(info) {
		this.#name = info.name
		this.#site = info.site
		this.#autoplay = info?.autoplay ?? false
		this.#selectors = info.selectors
	}

	/**
	 * @returns {Info}
	 */
	get info() {
		return {
			name: this.#name,
			site: this.#site,
			autoplay: this.#autoplay,
			selectors: this.#selectors
		}
	}

	/** Display name */
	get name() {
		return this.#name
	}

	/** Regex to check for compatible website */
	get site() {
		return this.#site
	}

	/** Whether media immediately plays on site load */
	get autoplay() {
		return this.#autoplay
	}

	/** Query selectors for page elements */
	get selectors() {
		return {...this.#selectors}
	}

	/**
	 * @param {string} url Url containing the media
	 * @return {boolean} Whether interaction with the page is possible
	 */
	compatible(url) {
		return Player.compatible(this.#site, url)
	}

	/**
	 * @param {string} site Site regex
	 * @param {string} url Url containing the media
	 * @return {boolean} Whether interaction with the page is possible
	 */
	static compatible(site, url) {
		return url.match(new RegExp(site, "g"))
	}
}

/**
 * @typedef {{togglePlay: string, elapsed: string, duration: string}} Selectors
 * @typedef {{name: string, site: string, selectors: Selectors, autoplay?: boolean}} Info
 */