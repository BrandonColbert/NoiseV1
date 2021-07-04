import Playback from "../../core/playback.js"
import Playlist from "../../core/playlist.js"
import DDListElement from "../ddListElement.js"
import PlaylistItemElement from "./playlistItemElement.js"
import UIElement from "../uiElement.js"

export default class PlaylistElement extends DDListElement {
	public readonly value: Playlist

	/** Medium for items to play media */
	public playback: Playback

	public constructor(playlist: Playlist) {
		super()
		this.value = playlist
	}

	/** Number of items in this playlist */
	public get size(): number {
		return this.children.length
	}

	/**
	 * @param index Item index
	 * @returns Item at the specified index
	 */
	public at(index: number): PlaylistItemElement {
		return this.children[index] as PlaylistItemElement
	}

	/**
	 * Selectively show the elements
	 * @param predicate Returns true to show an element or false to hide it
	 */
	public exhibit(predicate: (item: Playlist.Item) => boolean): void {
		for(let i = 0; i < this.size; i++) {
			let element = this.at(i)

			if(predicate(this.at(i).value))
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
		this.at(index).scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		})
	}

	public *[Symbol.iterator](): IterableIterator<PlaylistItemElement> {
		for(let child of this.children)
			yield child as PlaylistItemElement
	}

	protected override attached(): void {
		this.value.getItems().then(items => this.assign(items))
		this.value.events.on("changeContents", this.onContentsChanged)
		this.events.on("reorder", this.onChildrenReordered)
	}

	protected override detached(): void {
		this.value.events.forget("changeContents", this.onContentsChanged)
		this.events.forget("reorder", this.onChildrenReordered)
	}

	protected override onChildAttached(node: Node): void {
		super.onChildAttached(node)
		UIElement.restrict(node, PlaylistItemElement)
	}

	private assign(items: Playlist.Item[]): void {
		while(this.children.length > items.length)
			this.lastChild.remove()

		while(this.children.length < items.length)
			this.append(new PlaylistItemElement())

		for(let i = 0; i < this.children.length; i++)
			(this.children[i] as PlaylistItemElement).assign(i, items[i])
	}

	private onContentsChanged = async () => this.assign(await this.value.getItems())

	private onChildrenReordered = async (e: DDListElement.Events.Reorder) => {
		let items = [...this].map(e => e.value)

		let item = items[e.from]
		items.splice(e.from, 1)
		items.splice(e.to, 0, item)

		await this.value.setItems(items)
	}
}

PlaylistElement.register()