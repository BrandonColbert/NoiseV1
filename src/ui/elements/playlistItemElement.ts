import {clipboard} from "electron"
import TextUtils from "../../utils/textUtils.js"
import Playlist from "../../core/playlist.js"
import Courier from "../../core/courier.js"
import Dropdown from "../dropdown.js"
import PlaylistElement from "./playlistElement.js"
import UIElement from "../uiElement.js"

export default class PlaylistItemElement extends UIElement {
	public readonly icon: HTMLDivElement
	public readonly text: HTMLDivElement
	#value: Playlist.Item

	public constructor() {
		super()

		this.classList.add("item")

		this.icon = document.createElement("div")
		this.append(this.icon)

		this.text = document.createElement("div")
		this.append(this.text)
	}

	public get value(): Playlist.Item {
		return this.#value
	}

	public get playlist(): PlaylistElement {
		return this.parentElement as PlaylistElement
	}

	/**
	 * Show in document
	 */
	public show(): void {
		this.style.display = null
	}

	/**
	 * Hide in document
	 */
	public hide(): void {
		this.style.display = "none"
	}

	/**
	 * Associates the playlist item with that at the index
	 * @param index Item index
	 * @param item Item value
	 */
	public assign(index: number, item: Playlist.Item): void {
		this.#value = item

		this.text.textContent = item.query
		this.text.title = item.query
		
		if(item.courier)
			this.text.title = `${item.courier}: ${this.text.title}`

		this.text.onclick = e => {
			e.preventDefault()

			//Ignore if text is being edited
			if(document.activeElement == this.text)
				return

			this.playlist.playback?.play(index)
		}

		this.text.oncontextmenu = e => {
			e.preventDefault()

			Dropdown.show([
				{text: "Get link", callback: async () => {
					let courier = await Courier.load(this.#value.courier)
					let result = await courier.find(this.#value.query)

					clipboard.writeText(result.url)
				}},
				{text: "Copy", callback: () => clipboard.writeText(this.#value.query)},
				{text: "Redefine", callback: async () => {
					let result = await TextUtils.rename(this.text)

					if(result == null)
						return

					this.#value.query = result

					let items = await this.playlist.value.getItems()
					items[index] = this.#value
					await this.playlist.value.setItems(items)
				}},
				{text: "Set courier", callback: async () => {
					let couriers = await Courier.all()

					Dropdown.show(couriers.map(c => ({
						text: c.name,
						callback: async () => {
							let items = await this.playlist.value.getItems()
							items[index].courier = c.id
							await this.playlist.value.setItems(items)
						}
					})), {position: [`${e.clientX}px`, `${e.clientY}px`]})
				}},
				{text: "Delete", callback: async () => {
					let items = await this.playlist.value.getItems()
					items.splice(index, 1)
					await this.playlist.value.setItems(items)
				}}
			], {position: [`${e.clientX}px`, `${e.clientY}px`]})
		}
	}

	protected override attached(): void {
		UIElement.restrict(this.parentNode, PlaylistElement)
	}
}

PlaylistItemElement.register()