import {WebviewTag} from "electron"
import Noise from "../core/noise.js"

export default class PageContent {
	/** Content at the url */
	public readonly value: string
	private readonly page: Document
	private readonly url: URL

	private static recent: number[] = []
	private static allowed = true

	private constructor(url: string, content: string) {
		this.value = content
		this.url = new URL(url)
		this.page = new DOMParser().parseFromString(content, "text/html")

		//Set base url
		let base = this.page.createElement("base")
		base.href = `${this.url.origin}/`
		this.rootElement.append(base)
	}

	/** Root element on the page */
	public get rootElement(): Element {
		return this.page.documentElement
	}

	/**
	 * @param pattern Regex pattern
	 */
	public find(pattern: string) {
		return this.value.match(new RegExp(pattern, "g"))
	}

	public querySelector(query: string): Element {
		return this.page.querySelector(query)
	}

	public querySelectorAll(query: string): NodeListOf<Element> {
		return this.page.querySelectorAll(query)
	}

	public xpath(path: string): Node {
		return this.page.evaluate(
			path,
			this.page,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue
	}

	/**
	 * @param url Url to acquire content from
	 * @returns Cached PageContent at the URL
	 */
	public static async fetch(url: string): Promise<PageContent> {
		let settings = await Noise.getSettings()
		let time = Date.now()

		for(let i = PageContent.recent.length - 1; i >= 0; i--)
			if(PageContent.recent[i] < time - settings.fetching.recency) {
				PageContent.recent.splice(0, i + 1)
				break
			}

		PageContent.recent.push(time)

		if(PageContent.recent.length > settings.fetching.thresholdAbort) {
			PageContent.allowed = false
			console.error("Recency threshold reached, content fetching disabled. Refresh window with 'f5' or 'ctrl+r'.")
		}

		if(!PageContent.allowed)
			return Promise.reject("Accumulation disabled")

		if(PageContent.recent.length > settings.fetching.thresholdWait) {
			await new Promise<void>(r => setTimeout(() => r(), settings.fetching.recency))

			if(PageContent.recent.length > 0 && PageContent.recent[PageContent.recent.length - 1] == time)
				PageContent.recent.push(Date.now())
			else
				return Promise.reject(`Ignored content fetch for '${url}'`)
		}

		if(!PageContent.allowed)
			return Promise.reject("Accumulation disabled")

		let view = document.createElement("webview")
		view.classList.add("pageContentSource")

		let result = new Promise<PageContent>((resolve, reject) => {
			view.addEventListener("dom-ready", async e => {
				let view = e.target as WebviewTag
				view.setAudioMuted(true)

				try {
					await view.loadURL(url)

					let result = await view.executeJavaScript("document.documentElement.innerHTML") as string

					view.remove()

					resolve(new PageContent(url, result))
				} catch(e) {
					console.error(`Unable to acquire page content for "${url}" due to:\n\n${e}`)
					reject(e)
				}
			}, {once: true} as any)
		})

		view.src = "about:blank"
		document.body.append(view)

		return result
	}
}