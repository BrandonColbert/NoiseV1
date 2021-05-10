import {WebviewTag} from "electron"
import Noise from "../core/noise.js"

export default class Accumulator {
	/** Content at the url */
	readonly content: string

	/** Search times */
	private static recent: number[] = []

	/** Whether pages can be accumulated */
	private static allowed = true

	#page: Document
	
	private constructor(content: string) {
		this.content = content
		this.#page = new DOMParser().parseFromString(content, "text/html")
	}

	/**
	 * @param pattern Regex pattern
	 */
	find(pattern: string) {
		return this.content.match(new RegExp(pattern, "g"))
	}

	querySelector(query: string): Element {
		return this.#page.querySelector(query)
	}

	querySelectorAll(query: string): NodeListOf<Element> {
		return this.#page.querySelectorAll(query)
	}

	xpath(path: string): Node {
		return this.#page.evaluate(
			path,
			this.#page,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue
	}

	/**
	 * @param url Url to acquire content from
	 * @returns Accumulator from the URL's content
	 */
	static async from(url: string): Promise<Accumulator> {
		let time = Date.now()

		for(let i = Accumulator.recent.length - 1; i >= 0; i--)
			if(Accumulator.recent[i] < time - Noise.settings.recency) {
				Accumulator.recent.splice(0, i + 1)
				break
			}

		Accumulator.recent.push(time)

		if(Accumulator.recent.length > Noise.settings.thresholdAbort) {
			Accumulator.allowed = false
			console.error("Recency threshold reached, accumulation disabled. Manually restart")
		}

		if(!Accumulator.allowed)
			return Promise.reject("Accumulation disabled")

		if(Accumulator.recent.length > Noise.settings.thresholdWait) {
			await new Promise(r => setTimeout(r, Noise.settings.recency))

			if(Accumulator.recent.length > 0 && Accumulator.recent[Accumulator.recent.length - 1] == time)
				Accumulator.recent.push(Date.now())
			else
				return Promise.reject("Ignored")
		}

		if(!Accumulator.allowed)
			return Promise.reject("Accumulation disabled")

		let view = document.createElement("webview")
		view.classList.add("accumulatorSource")
		view.addEventListener("dom-ready", e => {
				let view = e.target as WebviewTag
				(view as any).audioMuted = true
		}, {once: true} as any)

		let result = new Promise<Accumulator>((resolve, reject) => {
			view.addEventListener("did-fail-load", () => reject("Failed to load"))
			view.addEventListener("did-stop-loading", async e => {
				let view = e.target as WebviewTag
				let result = await view.executeJavaScript("document.documentElement.innerHTML")
				view.remove()
				resolve(new Accumulator(result))
			}, {once: true} as any)
		})

		document.body.append(view)
		view.src = url

		return result
	}

	/**
	 * @param url Url with content
	 * @returns Content at url
	 */
	static async fetch(url: string): Promise<string> {
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