/**
 * Search times
 * @type {number[]}
 */
const recent = []

/** Whether pages can be accumulated */
let allowed = true

/** Accumulates information at a url */
export default class Accumulator {
	/** @type {string} */
	#content

	/** @type {DOMParser} */
	#parser

	/**
	 * @param {string} url URL to acquire content from
	 */
	constructor(url) {
		let time = Date.now()
		for(let i = recent.length - 1; i >= 0; i--)
			if(recent[i] < time - recency) {
				recent.splice(0, i + 1)
				break
			}

		recent.push(time)
		if(recent.length > thresholdAbort) {
			allowed = false
			console.error("Recency threshold reached, accumulation disabled. Manually restart")
		}

		if(!allowed)
			return Promise.reject("Accumulation disabled")

		return new Promise(async (resolve, reject) => {
			if(recent.length > thresholdWait) {
				await new Promise(r => setTimeout(r, recency))

				if(recent.length > 0 && recent[recent.length - 1] == time)
					recent.push(Date.now())
				else {
					reject("Ignored")
					return
				}
			}

			if(!allowed) {
				reject("Accumulation disabled")
				return
			}

			let view = document.createElement("webview")
			view.classList.add("accumulatorSource")
			view.addEventListener("dom-ready", e => e.target.audioMuted = true, {once: true})
			view.addEventListener("did-fail-load", () => resolve(this))
			view.addEventListener("did-stop-loading", async e => {
				let result = await e.target.executeJavaScript("document.documentElement.innerHTML")
				view.remove()

				this.#content = result
				this.#parser = new DOMParser().parseFromString(result, "text/html")
				resolve(this)
			}, {once: true})
			document.body.append(view)
			view.src = url
		})
	}

	/**
	 * @returns {string} Content at the url
	 */
	get content() {
		return this.#content
	}

	find(regex) {
		return this.#content.match(new RegExp(regex, "g"))
	}

	/**
	 * @returns {Element}
	 */
	querySelector(query) {
		return this.#parser.querySelector(query)
	}

	/**
	 * @returns {Element[]}
	 */
	querySelectorAll(query) {
		return this.#parser.querySelectorAll(query)
	}

	/**
	 * @returns {Node}
	 */
	xpath(path) {
		return this.#parser.evaluate(path, this.#parser, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
	}

	/**
	 * @param {string} url Url with content
	 * @returns {string} Content at url
	 */
	static async fetch(url) {
		return new Promise(resolve => {
			let request = new XMLHttpRequest()
	
			request.onload = () => {
				if(request.readyState == 4 && request.status == 200)
					resolve(request.responseText)
			}
	
			request.onerror = () => resolve(null)
			request.open("get", url, true)
			request.send()
		})
	}
}