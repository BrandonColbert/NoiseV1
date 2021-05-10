import Noise from "./noise.js"

/**
 * Contains a list of playable items and provides a means of ordered progression through them.
 */
export default class Playlist {
	/** @type {string} */
	#name
	/** @type {string} */
	#id
	/** @type {Item[]} */
	#items
	/** @type {number} */
	#index
	/** @type {boolean} */
	#started

	/**
	 * @param {string} id Identifier
	 * @param {Info} info
	 */
	constructor(id, info) {
		this.#id = id
		this.#name = info.name
		this.#items = info.items
		this.#index = 0
		this.#started = false
	}

	/**
	 * @return {Info}
	 */
	get info() {
		return {
			name: this.#name,
			items: this.#items
		}
	}

	/**
	 * @returns {string} Identifier
	 */
	get id() {
		return this.#id
	}

	/**
	 * @returns {string} Display name
	 */
	get name() {
		return this.#name
	}

	/**
	 * @param {string} value New name
	 */
	set name(value) {
		this.#name = value
		Noise.savePlaylist(this)
	}

	/**
	 * @returns {Item[]} Copy of this playlist's items
	 */
	get items() {
		return [...this.#items]
	}

	/**
	 * @return {number} Number of items
	 */
	get count() {
		return this.#items.length
	}

	/**
	 * @return {boolean} Whether the playlist has been started
	 */
	get started() {
		return this.#started
	}

	/** Current item index */
	get index() {
		return this.#index
	}

	/** Previous item */
	get previous() {
		return this.#items[Math.max(0, this.#index - 1)]
	}

	/** Current item */
	get current() {
		return this.#items[this.#index]
	}

	/** Next item */
	get next() {
		return this.#items[Math.min(this.#index + 1, this.#items.length - 1)]
	}

	/**
	 * Add an item
	 * @param {string} query Query to search for
	 * @param {string} courier Courier to use
	 */
	add(query, courier = undefined) {
		let item = {query: query}

		if(courier)
			item.courier = courier

		this.#items.push(item)
		Noise.savePlaylist(this)
	}

	/**
	 * Removes the items at the indices
	 * @param {...number} indices Item indices
	 */
	removeAt(...indices) {
		for(let index of indices)
			this.#items.splice(index, 1)

		Noise.savePlaylist(this)
	}

	/**
	 * @param {number} index Item index
	 * @returns {Item} Copy of item at the index
	 */
	getItem(index) {
		return {...this.#items[index]}
	}

	/**
	 * Set items at indices
	 * @param {...[number, Item]} entries Item index and value
	 */
	setItems(...entries) {
		for(let entry of entries) {
			let [index, value] = entry
			this.#items[index] = value
		}

		Noise.savePlaylist(this)
	}

	/**
	 * Progresses to the next item
	 * @return {Item} New current item
	 */
	progress() {
		return this.skipTo(this.#index + 1)
	}

	/**
	 * Regresses to the previous item
	 * @return {Item} New current item
	 */
	regress() {
		return this.skipTo(this.#index - 1)
	}

	/**
	 * Resets playlist progress
	 */
	reset() {
		this.#index = 0
		this.#started = false
	}

	/**
	 * Skips to the given index
	 * @param {number} index Item index
	 * @return {Item} New current item
	 */
	skipTo(index) {
		this.#index = Math.max(0, Math.min(index, this.#items.length - 1))
		this.#started = true

		return this.current
	}
}

/**
 * @typedef {{query: string, courier?: string}} Item
 * @typedef {{name: string, items: Item[]}} Info
 */