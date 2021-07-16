import {WebviewTag} from "electron"
import {promises as fs} from "fs"
import path from "path"
import Generate from "../utils/generate.js"
import Helper from "./helper.js"
import Noise from "./noise.js"
import Graph from "./nodes/graph.js"
import Dispatcher from "../utils/dispatcher.js"
import PlayerResultNode from "./nodes/playerResultNode.js"
import PlayerNode from "./nodes/playerNode.js"

type Nodes = {[id: string]: Graph.Node.Data}

export class Player extends Helper {
	public readonly id: string
	public readonly events: Dispatcher<Player.Events>
	public name: string
	private view: WebviewTag
	private playerResultNode?: Graph.Node

	protected constructor(id: string) {
		super()
		this.id = id
		this.graph.registerNodeType("player.result", PlayerResultNode)
		this.events = new Dispatcher("play", "pause", "end")
	}

	protected get path(): string {
		return `${Player.path}/${this.id}.json`
	}

	protected get info(): Player.Info {
		return {
			name: this.name,
			nodes: this.graph.getDataset()
		}
	}

	protected set info(value: Player.Info) {
		this.name = value.name
		this.graph.setDataset(value.nodes)
	}

	/** Number of seconds that the content has been playing */
	public async elapsedTime(): Promise<number> {
		if(this.playerResultNode)
			return await this.execute<number>(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")

				return e.currentTime
			`)

		return NaN
	}

	/** Number of seconds that the content lasts */
	public async duration(): Promise<number> {
		if(this.playerResultNode)
			return await this.execute<number>(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")

				return e.duration
			`)

		return NaN
	}

	/** Whether the media is currently playing */
	public async isPlaying(): Promise<boolean> {
		if(this.playerResultNode)
			return await this.execute<boolean>(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")

				return !e.paused
			`)

		return false
	}

	/**
	 * Resume the media
	 */
	public async resume(): Promise<void> {
		if(this.playerResultNode) {
			await this.execute(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")
				e.play()
			`)
		}
	}

	/**
	 * Pause the media
	 */
	public async pause(): Promise<void> {
		if(this.playerResultNode) {
			await this.execute(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")
				e.pause()
			`)
		}
	}

	/**
	 * Toggle the media's to play/pause state
	 */
	public async togglePlay(): Promise<void> {
		if(this.playerResultNode) {
			await this.execute(`
				let e = document.querySelector("${this.playerResultNode.getInput<string>("mediaSelectors")}")
				
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
		for(let node of this.graph)
			if(node instanceof PlayerNode)
				node.setInput("url", this.view.getURL())

		await this.graph.walk()

		this.playerResultNode = [...this.graph].find(n => n instanceof PlayerResultNode)

		if(this.playerResultNode) {
			let messageListener: (e: any) => Promise<void>

			this.view.addEventListener("ipc-message", messageListener = async e => {
				if(e.channel != "playerMessage")
					return

				switch(e.args[0]) {
					case "play":
						await this.events.fire("play")
						break
					case "pause":
						await this.events.fire("pause")
						break
					case "end":
						this.view.removeEventListener("ipc-message", messageListener)
						await this.events.fire("end")
						break
					default:
						console.error("Unexpected message", e.args[0])
						break
				}
			})

			let mediaSelectors = this.playerResultNode.getInput<string>("mediaSelectors")
			let adSelectors = this.playerResultNode.getInput<string>("adSelectors")

			await this.execute(`
				let media = document.querySelector("${mediaSelectors}")
				let isAd = false

				media.addEventListener("play", () => noise.send("play"))
				media.addEventListener("pause", () => noise.send("pause"))

				${
					adSelectors ?
						`media.addEventListener("timeupdate", () => {
							if(media.currentTime != media.duration || isNaN(media.duration))
								return
		
							isAd = document.querySelector("${adSelectors}") != null
						})` :
						""
				}

				media.addEventListener("ended", () => {
					if(isAd)
						return

					noise.send("end")
				})
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

	public async duplicate(name?: string): Promise<Player> {
		let players = await Player.all()
		let names = new Set<string>(players.map(p => p.name))

		if(!name) {
			let index = 0

			do {
				++index
				name = `${this.name} - Copy (${index})`
			} while(names.has(name))
		}

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
		//Find first matching player
		for await (let player of this) {
			//RegEx pattern to determine whether the URL is compatible with this player
			let playerResultNode = [...player.graph].find(n => n instanceof PlayerResultNode)
			let urlRegex = new RegExp(playerResultNode.getOption("urlPattern"), "g")

			if(!urlRegex.test(view.getURL()))
				continue

			//Associate with webview
			player.view = view

			return player
		}

		return null
	}

	public static async load(id: string): Promise<Player> {
		if(!id)
			return null

		let player = new Player(id)

		try {
			let data = await fs.readFile(player.path, "utf8")
			player.info = JSON.parse(data) as Player.Info
		} catch(e) {
			console.error(e)
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
		let players: Player[] = []

		for await (let player of this)
			players.push(player)

		return players
	}

	public static async *[Symbol.asyncIterator](): AsyncIterableIterator<Player> {
		for(let id of await Player.allIds()) {
			let player = await Player.load(id)

			if(!player)
				continue

			yield player
		}
	}
}

export namespace Player {
	export interface Info {
		/**
		 * Website name displayed to the user
		 */
		name: string

		nodes: Nodes
	}

	export interface Events {
		play: void
		pause: void
		end: void
	}
}

export default Player