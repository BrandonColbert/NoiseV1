import Playback from "../../core/playback.js"
import Playlist from "../../core/playlist.js"
import DDListElement from "../ddListElement.js"
import PlaylistItemElement from "./playlistItemElement.js"

export default class PlaylistElement extends Playlist {
	public readonly value: DDListElement
	public readonly playback: Playback
	private itemElements: PlaylistItemElement[]
	#items: Playlist.Item[]

	protected constructor(id: string, playback: Playback) {
		super(id)
		this.value = document.createElement("dd-list") as DDListElement
		this.playback = playback
		this.itemElements = []
	}

	public get items(): Playlist.Item[] {
		return this.#items
	}

	/**
	 * Selectively show the elements
	 * @param predicate Returns true to show an element or false to hide it
	 */
	public exhibit(predicate: (item: Playlist.Item) => boolean): void {
		for(let i = 0; i < this.items.length; i++) {
			let element = this.itemElements[i]

			if(predicate(this.items[i]))
				element.show()
			else
				element.hide()
		}
	}

	/**
	 * Ensures that the item at the index is visible to the user
	 * @param {number} index Item index
	 */
	public ensureVisibility(index: number) {
		this.itemElements[index].value.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		})
	}

	public *[Symbol.iterator]() {
		for(let itemElement of this.itemElements)
			yield itemElement
	}

	private assign(items: Playlist.Item[]): void {
		this.#items = items

		while(this.itemElements.length > this.#items.length)
			this.itemElements.pop().value.remove()

		while(this.itemElements.length < this.#items.length) {
			let itemElement = new PlaylistItemElement(this)
			this.itemElements.push(itemElement)

			this.value.append(itemElement.value)
		}

		let children = [...this.value.children]

		for(let itemElement of this.itemElements)
			itemElement.assign(children.indexOf(itemElement.value))

		this.value.events.forgetAll()

		this.value.events.on("reorder", async e => {
			let item = this.#items[e.from]
			this.#items.splice(e.from, 1)
			this.#items.splice(e.to, 0, item)

			await this.setItems(this.#items)
		})
	}

	public static async createElement(playlist: Playlist, playback: Playback): Promise<PlaylistElement> {
		let e = new PlaylistElement(playlist.id, playback)

		e.assign(await e.getItems())
		e.events.on("changeContents", async () => e.assign(await e.getItems()))

		return e
	}
}