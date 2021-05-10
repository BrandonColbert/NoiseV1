import Playlist from "./playlist.js"
import Item from "./item.js"
import Events from "./events.js"

/**
 * Contains a list of playable items and provides a means of ordered progression through them
 */
export default class PlayableList<T extends Events = Events> extends Playlist<T> {
	#index: number = 0
	#started: boolean = false

	/** Whether the playlist has been started */
	get started(): boolean {
		return this.#started
	}

	/** Current item index */
	get index(): number {
		return this.#index
	}

	/** Previous item */
	get previous(): Item {
		return this.getItem(Math.max(0, this.#index - 1))
	}

	/** Current item */
	get current(): Item {
		return this.getItem(this.#index)
	}

	/** Next item */
	get next(): Item {
		return this.getItem(Math.min(this.#index + 1, this.count - 1))
	}

	/**
	 * Progresses to the next item
	 * @return New current item
	 */
	progress(): Item {
		return this.skipTo(this.#index + 1)
	}

	/**
	 * Regresses to the previous item
	 * @return New current item
	 */
	regress(): Item {
		return this.skipTo(this.#index - 1)
	}

	/**
	 * Resets playlist progress
	 */
	reset(): void {
		this.#index = 0
		this.#started = false
	}

	/**
	 * Skips to the given index
	 * @param index Item index
	 * @return New current item
	 */
	skipTo(index: number): Item {
		this.#index = Math.max(0, Math.min(index, this.count - 1))
		this.#started = true

		return this.current
	}
}