import {remote} from "electron"
import fs from "fs"
import Events from "./events.js"
import Dispatcher from "../../utils/dispatcher.js"
import Item from "./item.js"
import Info from "./info.js"
import Noise from "../noise.js"
import Replicate from "../../utils/replicate.js"

const {v4: uuidv4}: {v4: () => string} = require("uuid")

/**
 * Contains a list of playable items
 */
export default class Playlist<T extends Events = Events> extends Dispatcher<T> {
	/** Identifies this playlist */
	readonly id: string

	#info: Info

	/**
	 * @param id Identifier of the playlist to load or unspecified for a new playlist
	 */
	constructor(id?: string) {
		super()
		this.id = id ?? uuidv4()

		this.registerEvent(
			"itemsChanged",
			"renamed",
			"deleted"
		)

		if(this.exists)
			this.#info = this.load()
		else {
			this.#info = {
				name: "New Playlist",
				items: []
			}

			this.save()
		}
	}

	/** Displayed name */
	get name(): string {
		return this.#info.name
	}

	/** Number of items */
	get count(): number {
		return this.#info.items.length
	}

	/** Path to playlist file */
	get path() {
		return `${Playlist.location}\\${this.id}.json`
	}

	/** Whether the playlist exists */
	get exists(): boolean {
		return fs.existsSync(this.path)
	}

	get info(): Info {
		return Replicate.clone(this.#info)
	}

	/** Directory where playlists are kept */
	static get location(): string {
		return `${Noise.location}\\playlists`
	}

	/**
	 * @param index Index of the item
	 * @returns Item at the index
	 */
	getItem(index: number): Item {
		return Replicate.clone(this.#info.items[index])
	}

	/**
	 * Add an item to the playlist
	 * @param item Item to add
	 */
	async add(item: Item): Promise<void> {
		this.#info.items.push(item)
		await this.save()
	}

	async setName(value: string): Promise<void> {
		this.fire("renamed", {newName: value, oldName: this.#info.name})
		this.#info.name = value
		await this.save()
	}

	/**
	 * Set items at indices
	 * @param entries Item index and value
	 */
	async setItems(...entries: [number, Item][]): Promise<void> {
		let items = [...this.#info.items]

		for(let entry of entries) {
			let [index, value] = entry
			this.#info.items[index] = value
		}

		this.fire("itemsChanged", {newItems: this.#info.items, oldItems: items})
		await this.save()
	}

	/**
	 * Removes the items at the indices
	 * @param indices Item indicies
	 */
	async removeAt(...indices: number[]): Promise<void> {
		let items = [...this.#info.items]

		for(let index of indices.sort((a, b) => b - a))
			this.#info.items.splice(index, 1)

		this.fire("itemsChanged", {newItems: this.#info.items, oldItems: items})
		await this.save()
	}

	/** Delete this playlist permanently */
	async delete() {
		this.fire("deleted")
		await fs.promises.unlink(this.path)
	}

	/** Exports this playlist with a file dialog */
	async export() {
		let {canceled, filePath} = await remote.dialog.showSaveDialog({
			defaultPath: `${this.#info.name}.json`,
			filters: [{
				name: "JavaScript Object Notation",
				extensions: ["json"]
			}]
		})

		if(canceled)
			return

		await fs.promises.writeFile(filePath, JSON.stringify(this.#info, null, "\t"), "utf8")
	}

	/**
	 * Ids of existing playlists in order
	 */
	static async getAllIds(): Promise<string[]> {
		return (await fs.promises.readdir(Playlist.location))
			.map(v => v.slice(0, -".json".length))
			.sort((a, b) => {
				let i = Noise.settings.playlistOrder.indexOf(a)
				let j = Noise.settings.playlistOrder.indexOf(b)
				
				if(i == -1) {
					if(j == -1)
						return 0
					else
						return 1
				} else if(j == -1)
					return -1
				else
					return i - j
			})
	}

	private async save(): Promise<void> {
		await fs.promises.writeFile(this.path, JSON.stringify(this.#info, null, "\t"))
	}

	private load(): Info {
		return JSON.parse(fs.readFileSync(this.path, "utf8"))
	}

	/** Playlist items */
	[Symbol.iterator](): Item[] {
		return this.#info.items.map(v => ({...v}))
	}
}