import fs from "fs"
import Accumulator from "../../utils/accumulator.js"
import Candidate from "./candidate.js"
import Info from "./info.js"
import Noise from "../noise.js"
import Pipe, {feed, Type} from "./pipe.js"

type Id = string

/**
 * Retrieves a url for the page containing the content requested from a query
 */
export default class Courier {
	/** Identifier */
	readonly id: Id

	#info: Info
	
	constructor(id: string, info: Info) {
		this.id = id
		this.#info = info
	}

	/** Display name */
	get name(): string {
		return this.#info.name
	}

	/** Pipe configuration */
	get pipes(): Pipe[] {
		return this.#info.pipes
	}

	/** Directory where couriers are kept */
	static get location(): string {
		return `${Noise.location}\\couriers`
	}

	/**
	 * @param query Content description
	 * @returns Matched content
	 */
	async find(query: string): Promise<Candidate[]> {
		let next = this.pipes.find(e => e.type == "request")
		let values: any[] = [query]

		while(next.pipes && next.pipes.length > 0) {
			let pipe = next.pipes[0]
			values = feed(pipe, next.type, values)
			next = pipe
		}

		let [page] = values

		next = this.pipes.find(e => e.type == "content")

		try {
			values = [await Accumulator.from(page)]
		} catch(e) {
			return []
		}

		let urls: string[] = []
		let titles: string[] = []

		function traverse(pipe: Pipe, type: Type, values: any[]): void {
			if(type != null)
				values = feed(pipe, type, values)

			// console.log([pipe.type, values])

			if(pipe.pipes && pipe.pipes.length > 0) {
				for(let p of pipe.pipes)
					traverse(p, pipe.type, values)
			} else
				switch(pipe.type) {
					case "url":
						urls.push(...values)
						break
					case "title":
						titles.push(...values)
				}
		}

		traverse(next, null, values)

		let length = Math.min(urls.length, titles.length)
		let candidates: Candidate[] = []
		for(let i = 0; i < length; i++)
			candidates.push({url: urls[i] ?? "", title: titles[i] ?? ""})

		// console.log(candidates)

		return candidates
	}

	/**
	 * @param id Courier id
	 * @returns Courier corresponding to the id
	 */
	static async from(id: Id): Promise<Courier> {
		return new Courier(
			id,
			JSON.parse(await fs.promises.readFile(`${Courier.location}\\${id}.json`, "utf8"))
		)
	}

	/**
	 * Ids of existing couriers sorted by Courier name
	 */
	static async getAllIds(): Promise<string[]> {
		let filenames = await fs.promises.readdir(Courier.location)
		let ids = filenames.map(v => v.slice(0, -"json".length))
		let couriers = await Promise.all(ids.map(v => Courier.from(v)))
		couriers.sort((a, b) => a.name.localeCompare(b.name))

		return couriers.map(v => v.id)
	}
}