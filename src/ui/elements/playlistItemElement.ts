import {clipboard} from "electron"
import TextUtils from "../../utils/textUtils.js"
import Playlist from "../../core/playlist.js"
import Courier from "../../core/courier.js"
import Dropdown from "../dropdown.js"
import PlaylistElement from "./playlistElement.js"

export default class PlaylistItemElement {
	public readonly value: HTMLElement
	private playlist: PlaylistElement
	private text: HTMLDivElement
	#item: Playlist.Item

	public constructor(playlist: PlaylistElement) {
		this.playlist = playlist

		this.value = document.createElement("div")
		this.value.classList.add("item")

		let icon = document.createElement("div")
		this.value.append(icon)

		this.text = document.createElement("div")
		this.value.append(this.text)
	}

	/**
	 * Show in document
	 */
	public show(): void {
		this.value.style.display = null
	}

	/**
	 * Hide in document
	 */
	public hide(): void {
		this.value.style.display = "none"
	}

	/**
	 * Associates the playlist item with that at the index
	 * @param index Item index
	 */
	public assign(index: number): void {
		this.#item = this.playlist.items[index]

		this.text.textContent = this.#item.query
		this.text.title = this.#item.query

		this.text.onclick = e => {
			e.preventDefault()
			this.playlist.playback.play(index)
		}

		this.text.oncontextmenu = e => {
			e.preventDefault()

			Dropdown.show([
				{text: "Get link", callback: async () => {
					let courier = await Courier.load(this.#item.courier)
					let result = await courier.find(this.#item.query)

					clipboard.writeText(result.url)
				}},
				{text: "Copy", callback: () => clipboard.writeText(this.#item.query)},
				{text: "Redefine", callback: async () => {
					let result = await TextUtils.rename(this.text)

					if(result == null)
						return

					this.#item.query = result

					let items = await this.playlist.getItems()
					items[index] = this.#item
					await this.playlist.setItems(items)
				}},
				{text: "Set courier", callback: async () => {
					let couriers = await Courier.all()

					Dropdown.show(couriers.map(c => ({
						text: c.name,
						callback: async () => {
							let items = await this.playlist.getItems()
							items[index].courier = c.id
							await this.playlist.setItems(items)
						}
					})), {position: [`${e.clientX}px`, `${e.clientY}px`]})
				}},
				{text: "Delete", callback: async () => {
					let items = await this.playlist.getItems()
					items.splice(index, 1)
					await this.playlist.setItems(items)
				}}
			], {position: [`${e.clientX}px`, `${e.clientY}px`]})
		}
	}
}