import {promises as fs} from "fs"
import {remote} from "electron"
import path from "path"
import Noise from "./noise.js"
import Dispatcher from "../utils/dispatcher.js"
import Generate from "../utils/generate.js"

/**
 * Contains a list of playable media items
 * 
 * May be iterated directly for each item
 */
export class Playlist {
	public readonly id: string
	public readonly events: Dispatcher<Events>

	protected constructor(id: string) {
		this.id = id
		this.events = new Dispatcher<Events>(["changeContents", "delete", "rename"])
	}

	private get path(): string {
		return `${Noise.rootDirectory}\\playlists\\${this.id}.json`
	}

	public async getName(): Promise<string> {
		let info = await this.getInfo()
		return info.name
	}

	/**
	 * Rename to the given value if possible
	 * @param value New name
	 * @returns Whether renaming succeeded
	 */
	public async setName(value: string): Promise<boolean> {
		let info = await this.getInfo()
		let oldName = info.name

		if(value.length == 0) //Prevent renaming to empty string
			return false
		if(value == oldName) //Prevent renaming to same name
			return false

		//Update info
		info.name = value
		await this.setInfo(info)

		//Post event
		await this.events.fire("rename", {oldName: oldName, newName: value})

		return true
	}

	public async getItems(): Promise<Playlist.Item[]> {
		let info = await this.getInfo()
		return info.items
	}

	public async setItems(value: Playlist.Item[]): Promise<void> {
		//Update info
		let info = await this.getInfo()
		info.items = value
		await this.setInfo(info)

		//Post event
		await this.events.fire("changeContents")
	}

	/**
	 * Delete this playlist permanently
	 */
	public async delete(): Promise<void> {
		await fs.unlink(this.path)
		await this.events.fire("delete")
	}

	/**
	 * Display a file dialog to save the playlist as a .json file
	 */
	public async export(path: string = null): Promise<void> {
		if(path == null) {
			let {canceled, filePath} = await remote.dialog.showSaveDialog({
				defaultPath: `${await this.getName()}.json`,
				filters: [{
					name: "JavaScript Object Notation",
					extensions: ["json"]
				}]
			})

			if(canceled)
				return

			path = filePath
		}

		await fs.writeFile(
			path,
			JSON.stringify(await this.getInfo(), null, "\t"),
			"utf8"
		)
	}

	public async *[Symbol.asyncIterator]() {
		for(let item of await this.getItems())
			yield item
	}

	private async getInfo(): Promise<Playlist.Info> {
		let data = await fs.readFile(this.path, "utf8")
		return JSON.parse(data) as Playlist.Info
	}

	private async setInfo(value: Playlist.Info): Promise<void> {
		await fs.writeFile(
			this.path,
			JSON.stringify(value, null, "\t")
		)
	}

	/**
	 * Loads a playlist by id
	 * @param id Id of the playlist
	 * @returns The playlist with the associated id if it exists, otherwise null
	 */
	public static async load(id: string): Promise<Playlist> {
		let playlist = new Playlist(id)

		try {
			await fs.access(playlist.path)
		} catch {
			return null
		}

		return playlist
	}

	/**
	 * Imports a playlist from a path
	 * 
	 * Opens a file picker dialog if path is left unspecified
	 * @param paths Paths to the playlists
	 * @returns The imported playlist or null if not import failed
	 */
	public static async import(paths: string[] = null): Promise<Playlist[]> {
		if(paths == null) {
			let result = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
				properties: [
					"openFile",
					"multiSelections"
				]
			})

			if(result.canceled)
				return null

			paths = result.filePaths
		}

		return await Promise.all(paths.map(async path => {
			let data = await fs.readFile(path, "utf8")
			let info = JSON.parse(data) as Playlist.Info

			let playlist = await Playlist.create(info.name)
			await playlist.setInfo(info)

			return playlist
		}))
	}

	/**
	 * Create a new playlist
	 * @param name Name of the playlist
	 * @returns The new playlist or null if not possible
	 */
	public static async create(name: string = null): Promise<Playlist> {
		let playlist = new Playlist(Generate.uuid())

		await playlist.setInfo({
			name: name ?? "New Playlist",
			items: []
		})

		return playlist
	}

	/**
	 * All existing playlists
	 */
	public static async all(): Promise<Playlist[]> {
		let dirents = await fs.readdir(`${Noise.rootDirectory}\\playlists`, {withFileTypes: true})

		let playlists = dirents
			.filter(d => d.isFile() && path.extname(d.name) == ".json")
			.map(d => new Playlist(d.name.slice(0, -path.extname(d.name).length)))

		let names = await Promise.all(playlists.map(async p => await p.getName()))
		let p2n = new Map<Playlist, string>(playlists.map((p, i) => ([p, names[i]])))

		playlists.sort((a, b) => p2n.get(a).localeCompare(p2n.get(b)))

		return playlists
	}
}

export default Playlist

export namespace Playlist {
	/**
	 * Represents a playable media
	 */
	export interface Item {
		/** Query to find the associated media with */
		query: string

		/** Courier name */
		courier?: string
	}

	export interface Info {
		name: string
		items: Item[]
	}
}

interface Events {
	/** Playlist receives a new name */
	rename: {oldName: string, newName: string}

	/** Media items modified */
	changeContents: void

	/** Playlist deleted */
	delete: void
}