import {promises as fs} from "fs"
import path from "path"
import filenamify from "filenamify"
import Graph from "./nodes/graph.js"
import Noise from "./noise.js"
import Helper from "./helper.js"
import CourierNode from "./nodes/courierNode.js"
import CourierResultNode from "./nodes/courierResultNode.js"

type Nodes = {[id: string]: Graph.Node.Data}

/**
 * Retrieves a url for the page containing the media requested from a query
 */
export class Courier extends Helper {
	public readonly id: string
	#name: string

	protected constructor(id: string) {
		super()
		this.id = id
		this.graph.registerNodeType("courier", CourierNode)
		this.graph.registerNodeType("courier.result", CourierResultNode)
	}

	public get name(): string {
		return this.#name
	}

	protected get path(): string {
		return `${Courier.path}/${this.id}.json`
	}

	protected get info(): Courier.Info {
		return {
			name: this.name,
			nodes: this.graph.getDataset()
		}
	}

	protected set info(value: Courier.Info) {
		this.#name = value.name
		this.graph.setDataset(value.nodes)
	}

	/**
	 * @param query Query to find media with
	 * @returns Media found based on the query
	 */
	public async find(query: string): Promise<Courier.Result> {
		//Prepare special nodes for propogation
		for(let node of this.graph)
			if(node instanceof CourierNode)
				node.setInput("query", query)

		//Walk entire graph
		await this.graph.walk()

		//Find the first completed title and url node
		let completedNodes = [...this.graph].filter(n => n.status == Graph.Node.Status.Complete)
		let titleNode = completedNodes.find(n => n instanceof CourierResultNode)
		let urlNode = completedNodes.find(n => n instanceof CourierResultNode)

		if(!urlNode)
			return null

		//Return their input as the result
		return {
			title: titleNode?.getInput("title"),
			url: urlNode.getInput("url")
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

	public async duplicate(name?: string): Promise<Courier> {
		if(!name) {
			let index = 0

			while(index <= 100) {
				++index
				name = `${this.name} - Copy (${index})`

				try {
					await fs.access(`${Courier.path}/${filenamify(name.toLowerCase())}.json`)
				} catch {
					break
				}
			}
		}

		let courier = await Courier.create(name)

		if(!courier)
			return null

		let info = JSON.parse(JSON.stringify(this.info)) as Courier.Info
		info.name = name

		courier.info = info
		await courier.save()

		return courier
	}

	public static get path(): string {
		return `${Noise.Paths.config}/couriers`
	}

	public static async load(id: string): Promise<Courier> {
		if(!id)
			return null

		let courier = new Courier(id)

		try {
			let data = await fs.readFile(courier.path, "utf8")
			courier.info = JSON.parse(data) as Courier.Info
		} catch(e) {
			console.error(e)
			return null
		}

		return courier
	}

	public static async create(name: string): Promise<Courier> {
		let courier = new Courier(filenamify(name.toLowerCase()))

		try {
			await fs.access(courier.path)

			return null
		} catch {}

		courier.info = {
			name: name,
			nodes: {}
		}

		return courier
	}

	public static async allIds(): Promise<string[]> {
		let dirents = await fs.readdir(Courier.path, {withFileTypes: true})

		return dirents
			.filter(d => d.isFile() && path.extname(d.name) == ".json")
			.map(d => d.name.slice(0, -path.extname(d.name).length))
	}

	public static async all(): Promise<Courier[]> {
		let couriers: Courier[] = []

		for await(let courier of this)
			couriers.push(courier)

		return couriers
	}

	public static async *[Symbol.asyncIterator](): AsyncIterableIterator<Courier> {
		for(let id of await Courier.allIds()) {
			let courier = await Courier.load(id)

			if(!courier)
				continue

			yield courier
		}
	}
}

export namespace Courier {
	export interface Info {
		/** User friendly name of the courier */
		name: string
		nodes: Nodes
	}

	export interface Result {
		url: string
		title?: string
	}
}

export default Courier