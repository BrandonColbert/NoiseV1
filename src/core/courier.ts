import {promises as fs} from "fs"
import path from "path"
import TextUtils from "../utils/textUtils.js"
import Graph from "./nodes/graph.js"
import Noise from "./noise.js"
import Helper from "./helper.js"
import RequestNode from "../core/nodes/requestNode.js"
import MediaUrlNode from "../core/nodes/mediaUrlNode.js"
import MediaTitleNode from "../core/nodes/mediaTitleNode.js"

type Nodes = {[id: string]: Graph.Node.Data}

/**
 * Retrieves a url for the page containing the media requested from a query
 */
export class Courier extends Helper {
	public readonly id: string
	public name: string

	protected constructor(id: string) {
		super()
		this.id = id
		this.graph.registerNodeType("request", RequestNode)
		this.graph.registerNodeType("mediaTitle", MediaTitleNode)
		this.graph.registerNodeType("mediaUrl", MediaUrlNode)
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
		this.name = value.name
		this.graph.setDataset(value.nodes)
	}

	/**
	 * @param query Query to find media with
	 * @returns Media found based on the query
	 */
	public async find(query: string): Promise<Courier.Result> {
		//Prepare special nodes for propogation
		for(let node of this.graph)
			if(node instanceof RequestNode)
				node.setInput("query", query)

		//Walk entire graph
		await this.graph.walk()

		//Find the first completed title and url node
		let completedNodes = [...this.graph].filter(n => n.status == Graph.Node.Status.Complete)
		let titleNode = completedNodes.find(n => n instanceof MediaTitleNode)
		let urlNode = completedNodes.find(n => n instanceof MediaUrlNode)

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

	public async duplicate(): Promise<Courier> {
		let path: string
		let index = 0

		while(true) {
			++index
			path = `${this.path.slice(0, -".json".length)}_copy_${index}.json`

			try {
				await fs.access(path)
			} catch {
				break
			}
		}

		let info = JSON.parse(JSON.stringify(this.info)) as Courier.Info
		info.name = `${this.name} - Copy (${index})`
		
		let courier = new Courier(`${this.id}_copy_${index}`)
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

	public static async create(name: string): Promise<Courier>
	public static async create(id: string, name: string): Promise<Courier>
	public static async create(par1: string, par2?: string): Promise<Courier> {
		let id: string
		let name: string

		if(par2) {
			id = par1
			name = par2
		} else {
			name = par1
			id = encodeURI(TextUtils.simplify(name))
		}

		if(!name)
			return null

		let courier = new Courier(id)

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