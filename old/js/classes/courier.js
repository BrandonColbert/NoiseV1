import Accumulator from "./accumulator.js"

/**
 * @param {Pipe} pipe Pipe being fed
 * @param {string} type Input pipe type
 * @param {object[]} values Input values
 * @returns {object[]} Fed pipe output
 */
function feed(pipe, type, values) {
	switch(pipe.type) {
		case "uri": return values.map(e => encodeURI(e))
		case "format": return values.map(e => pipe.value.replace("{}", e))
		case "selector": return values.map(e => e.querySelector(pipe.value))
		case "selectorAll": return values.map(e => Array.from(e.querySelectorAll(pipe.value))).flat()
		case "property": return values.map(e => e[pipe.value])
		case "regex": return values.map(e => {
			let matches = e.match(new RegExp(pipe.value, "g"))
			return matches.length > 0 ? matches[0] : ""
		})
		default:
			return values
	}
}

/**
 * Retrieves a url for the page containing the content requested from a query
 */
export default class Courier {
	/** @type {string} */
	#id
	/** @type {string} */
	#name
	/** @type {{Pipe[]}} */
	#pipes

	/**
	 * @param {Info} info
	 */
	constructor(info) {
		this.#id = info.id
		this.#name = info.name
		this.#pipes = info.pipes
	}

	/**
	 * @returns {Info}
	 */
	get info() {
		return {
			id: this.#id,
			name: this.#name,
			pipes: this.#pipes
		}
	}

	/**
	 * Identifier
	 * @returns {string}
	 */
	get id() {
		return this.#id
	}

	/**
	 * Display name
	 * @returns {string}
	 */
	get name() {
		return this.#name
	}

	/**
	 * Pipe configuration
	 * @returns {Pipe[]}
	 */
	get pipes() {
		return this.#pipes
	}

	/**
	 * @param {string} query Content description
	 * @returns {Candidate[]} Matched content
	 */
	async find(query) {
		let next = this.pipes.find(e => e.type == "request")
		let values = [query]

		while(next.pipes && next.pipes.length > 0) {
			let pipe = next.pipes[0]
			values = feed(pipe, next.type, values)
			next = pipe
		}

		let [page] = values

		next = this.pipes.find(e => e.type == "content")

		try {
			values = [await new Accumulator(page)]
		} catch(e) {
			return []
		}

		let urls = []
		let titles = []

		/**
		 * @param {Pipe} pipe
		 * @param {string} type
		 * @param {object[]} values
		 * @returns {object[]}
		 */
		function traverse(pipe, type, values) {
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
		let candidates = []
		for(let i = 0; i < length; i++)
			candidates.push({url: urls[i] ?? "", title: titles[i] ?? ""})

		// console.log(candidates)

		return candidates
	}
}

/**
 * @typedef {{type: string, value?: string, pipes?: Pipe[]}} Pipe
 * @typedef {{url: string, title: string}} Candidate
 * @typedef {{name: string, pipes: Pipe[]}} Info
 */