import {WebviewTag} from "electron"
import {promises as fs} from "fs"
import path from "path"
import Generate from "../utils/generate.js"
import Helper from "./helper.js"
import Noise from "./noise.js"
import Graph from "./nodes/graph.js"
import MediaNode from "./nodes/mediaNode.js"
import Dispatcher from "../utils/dispatcher.js"

type Nodes = {[id: string]: Graph.Node.Data}

export class Player extends Helper {
	public readonly id: string
	public readonly events: Dispatcher<Player.Events>
	public name: string
	private urlPattern: string
	private urlRegex: RegExp
	private view: WebviewTag
	private mediaNode: Graph.Node

	protected constructor(id: string) {
		super()
		this.id = id
		this.graph.registerNodeType("media", MediaNode)
		this.events = new Dispatcher<Player.Events>(["play", "pause", "end"])
	}

	protected get path(): string {
		return `${Player.path}/${this.id}.json`
	}

	protected get info(): Player.Info {
		return {
			name: this.name,
			urlPattern: this.urlPattern,
			nodes: this.graph.nodeData
		}
	}

	protected set info(value: Player.Info) {
		this.name = value.name
		this.urlPattern = value.urlPattern
		this.urlRegex = new RegExp(value.urlPattern, "g")
		this.graph.nodeData = value.nodes
	}

	/** Number of seconds that the content has been playing */
	public async elapsedTime(): Promise<number> {
		if(this.mediaNode)
			return await this.execute<number>(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")

				return e.currentTime
			`)

		return NaN
	}

	/** Number of seconds that the content lasts */
	public async duration(): Promise<number> {
		if(this.mediaNode)
			return await this.execute<number>(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")

				return e.duration
			`)

		return NaN
	}

	/** Whether the media is currently playing */
	public async isPlaying(): Promise<boolean> {
		if(this.mediaNode)
			return await this.execute<boolean>(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")

				return !e.paused
			`)

		return false
	}

	/**
	 * Resume the media
	 */
	public async resume(): Promise<void> {
		if(this.mediaNode) {
			await this.execute(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")
				e.play()
			`)
		}
	}

	/**
	 * Pause the media
	 */
	public async pause(): Promise<void> {
		if(this.mediaNode) {
			await this.execute(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")
				e.pause()
			`)
		}
	}

	/**
	 * Toggle the media's to play/pause state
	 */
	public async togglePlay(): Promise<void> {
		if(this.mediaNode) {
			await this.execute(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")
				
				if(e.paused)
					e.play()
				else
					e.pause()
			`)
		}
	}

	/**
	 * Enables detection media events and values on the webview
	 */
	public async bind(): Promise<void> {
		this.mediaNode = [...this.graph].find(n => n instanceof MediaNode)

		if(this.mediaNode) {
			this.view.addEventListener("ipc-message", async e => {
				switch(e.args[0]) {
					case "play":
						await this.events.fire("play")
						break
					case "pause":
						await this.events.fire("pause")
						break
					case "end":
						await this.events.fire("end")
						break
				}
			})

			await this.execute(`
				let e = document.querySelector("${this.mediaNode.getOption("selectors")}")
				e.addEventListener("play", () => noise.send("play"))
				e.addEventListener("pause", () => noise.send("pause"))
				e.addEventListener("ended", () => noise.send("end"))
			`)
		}
	}

	public async save(): Promise<void> {
		await fs.writeFile(
			this.path,
			JSON.stringify(this.info, null, "\t"),
			"utf8"
		)
	}

	public async delete(): Promise<void> {
		await fs.unlink(this.path)
	}

	public async duplicate(): Promise<Player> {
		let players = await Player.all()
		let names = new Set<string>(players.map(p => p.name))

		let name: string = null
		let index = 0

		do {
			++index
			name = `${this.name} - Copy (${index})`
		} while(names.has(name))

		let info = JSON.parse(JSON.stringify(this.info)) as Player.Info
		info.name = name

		let player = new Player(Generate.uuid())
		player.info = info
		await player.save()

		return player
	}

	private async execute<T = any>(code: string): Promise<T> {
		return await this.view.executeJavaScript(`(() => {${code}})()`, true) as T
	}

	public static get path(): string {
		return `${Noise.Paths.config}/players`
	}

	public static async create(name: string = "New Player"): Promise<Player> {
		let player = new Player(Generate.uuid())
		player.name = name

		return player
	}

	/**
	 * Creates a player for the webview
	 * @param view Webview instance
	 */
	public static async for(view: WebviewTag): Promise<Player> {
		let players = await Player.all()

		//Find first matching player
		let player = players.find(p => p.urlRegex.test(view.getURL()))

		if(!player)
			return null

		//Associate with webview
		player.view = view

		return player
	}

	public static async load(id: string): Promise<Player> {
		if(!id)
			return null

		let player = new Player(id)

		try {
			let data = await fs.readFile(player.path, "utf8")
			player.info = JSON.parse(data) as Player.Info
		} catch {
			return null
		}

		return player
	}

	public static async allIds(): Promise<string[]> {
		//Get player filenames
		let dirents = await fs.readdir(Player.path, {withFileTypes: true})

		//Transform filenames to ids
		return dirents
			.filter(d => d.isFile() && path.extname(d.name) == ".json")
			.map(d => d.name.slice(0, -path.extname(d.name).length))
	}

	public static async all(): Promise<Player[]> {
		let ids = await Player.allIds()

		//Transform ids to player isntances
		return await Promise.all(ids.map(async id => Player.load(id)))
	}
}

export namespace Player {
	export interface Info {
		/**
		 * Website name displayed to the user
		 */
		name: string

		/**
		 * RegEx pattern to determine whether the URL is compatible with this player
		 */
		urlPattern: string

		nodes: Nodes
	}

	export interface Events {
		play: void
		pause: void
		end: void
	}
}

export default Player