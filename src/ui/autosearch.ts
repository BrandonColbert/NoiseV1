import Hierarchy from "../utils/hierarchy.js"
import Dispatcher from "../utils/dispatcher.js"
import TextUtils from "../utils/textUtils.js"
import UIElement from "./uiElement.js"

/**
 * Autocomplete searchbar
 */
export class Autosearch extends UIElement {
	public readonly events: Dispatcher<Autosearch.Events>
	public readonly input: HTMLDivElement
	public readonly candidates: HTMLDivElement
	private options: Autosearch.Options

	public constructor(entries: string[], options: Autosearch.Options = {}) {
		super()
		this.options = options

		this.events = new Dispatcher("select")

		this.input = document.createElement("div")
		this.input.contentEditable = "true"
		this.append(this.input)

		this.candidates = document.createElement("div")
		this.append(this.candidates)

		for(let entry of entries)
			this.candidates.append(new Autosearch.Item(entry))
	}

	public static show(...args: ConstructorParameters<typeof Autosearch>): Promise<string> {
		let element = new Autosearch(...args)

		return new Promise(r => {
			let blurListener: (e: FocusEvent) => void
			let mouseLeaveListener: (e: MouseEvent) => void
			let mouseDownListener: (e: MouseEvent) => void
			let selectListener: (e: Autosearch.Events.Select) => void

			let clearEvents = () => {
				element.events.forget("select", selectListener)
				element.input.removeEventListener("blur", blurListener)
				element.removeEventListener("mousedown", mouseDownListener)
				element.removeEventListener("mouseleave", mouseLeaveListener)
			}

			blurListener = mouseLeaveListener = () => {
				clearEvents()

				element.remove()
				r(null)
			}

			selectListener = e => {
				clearEvents()

				let result = e.value
				element.remove()

				r(result)
			}

			mouseDownListener = () => {
				element.input.removeEventListener("blur", blurListener)
				element.addEventListener("mouseleave", mouseLeaveListener)
			}

			element.events.on("select", selectListener)
			element.input.addEventListener("blur", blurListener)
			element.addEventListener("mousedown", mouseDownListener)

			document.body.append(element)
			element.input.focus()
		})
	}

	protected override attached(): void {
		let {style} = this

		if(this.options.count != undefined) {
			let {style} = this.candidates

			let rect = this.candidates.getBoundingClientRect()
			let childHeight = 2 * rect.height / this.candidates.children.length
			let height = this.options.count * childHeight

			style.overflowY = "auto"
			style.maxHeight = `${height}px`
		}

		if(this.options.position) {
			let [x, y] = this.options.position

			style.left = x.toString()
			style.top = y.toString()
		} else {
			style.left = "0px"
			style.top = "0px"
		}

		this.input.addEventListener("input", this.onInput)
		this.input.addEventListener("keydown", this.onInputKeyDown)
	}

	protected override detached(): void {
		this.input.removeEventListener("input", this.onInput)
		this.input.removeEventListener("keydown", this.onInputKeyDown)
	}

	private filter(): void {
		let query = TextUtils.simplify(this.input.textContent)
		let anyVisible = false

		for(let candidate of this.candidates.children) {
			if(!(candidate instanceof Autosearch.Item))
				continue

			anyVisible = candidate.filter(query) || anyVisible
		}

		this.candidates.style.display = anyVisible ? "" : "none"
		this.candidates.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"))
	}

	private onInput = () => this.filter()

	private onInputKeyDown = (event: KeyboardEvent) => {
		switch(event.key) {
			case "Escape":
				this.events.fire("select", {value: null})
			case "Enter": {
				event.preventDefault()

				let item = this.candidates.querySelector<Autosearch.Item>(".selected")

				if(item && item.value != this.input.textContent) {
					this.input.textContent = item.value
					this.moveCursorToEnd()
				} else
					this.events.fire("select", {value: this.input.textContent})

				break
			}
			case "Tab": {
				event.preventDefault()

				let candidates = [...this.candidates.children] as Autosearch.Item[]

				if(candidates.length == 0)
					break

				let item = this.candidates.querySelector<Autosearch.Item>(".selected")

				if(!item) {
					item = Hierarchy.findSibling<Autosearch.Item>(
						this.candidates.firstElementChild as Autosearch.Item,
						e => e.style.display != "none"
					)
				} else if(this.input.textContent == item.value) {
					item.classList.remove("selected")
					item = Hierarchy.findSibling<Autosearch.Item>(
						item,
						e => e.style.display != "none",
						{selfInclusive: false}
					)
				}

				if(!item)
					break

				item.classList.add("selected")
				item.scrollIntoView({
					behavior: "smooth",
					block: "nearest"
				})

				this.input.textContent = item.value
				this.moveCursorToEnd()
				break
			}
			case "ArrowUp": {
				event.preventDefault()

				let prevItem = this.candidates.querySelector<HTMLElement>(".selected")
				prevItem?.classList.remove("selected")

				let item = Hierarchy.findSibling<HTMLElement>(prevItem, e => e.style.display != "none", {selfInclusive: false, direction: "backward"})
					?? Hierarchy.findSibling<HTMLElement>(this.candidates.lastElementChild as HTMLElement, e => e.style.display != "none", {direction: "backward"})

				item.classList.add("selected")

				item.scrollIntoView({
					behavior: "smooth",
					block: "nearest"
				})
				break
			}
			case "ArrowDown": {
				event.preventDefault()

				let prevItem = this.candidates.querySelector<HTMLElement>(".selected")
				prevItem?.classList.remove("selected")

				let item = Hierarchy.findSibling<HTMLElement>(prevItem, e => e.style.display != "none", {selfInclusive: false})
					?? Hierarchy.findSibling<HTMLElement>(this.candidates.firstElementChild as HTMLElement, e => e.style.display != "none")

				item.classList.add("selected")

				item.scrollIntoView({
					behavior: "smooth",
					block: "nearest"
				})
				break
			}
		}
	}

	private moveCursorToEnd(): void {
		let range = document.createRange()
		range.selectNodeContents(this.input)

		let selection = window.getSelection()
		selection.removeAllRanges()
		selection.addRange(range)
		selection.collapseToEnd()
	}
}

export namespace Autosearch {
	export class Item extends UIElement {
		public readonly start: HTMLDivElement
		public readonly end: HTMLDivElement
		public readonly value: string

		public constructor(value: string) {
			super()
			this.value = value
			this.append(this.start = document.createElement("div"))
			this.append(this.end = document.createElement("div"))
		}

		private get autosearch(): Autosearch {
			return this.closest<Autosearch>("ui-autosearch")
		}

		public filter(query?: string): boolean {
			let visible = !query || this.value.startsWith(query)
			this.style.display = visible ? "" : "none"

			this.start.textContent = query ? this.value.slice(0, query.length) : ""
			this.end.textContent = query ? this.value.slice(query.length) : this.value

			return visible
		}

		protected override attached(): void {
			this.filter()

			this.addEventListener("click", this.onClick)
		}

		protected override detached(): void {
			this.removeEventListener("click", this.onClick)
		}

		private onClick = (event: MouseEvent) => {
			event.preventDefault()
			this.autosearch.events.fire("select", {value: this.value})
		}
	}

	export interface Options {
		count?: number
		position?: [number | string, number | string]
	}

	export interface Events {
		select: Events.Select
	}

	export namespace Events {
		export interface Select {
			value: string
		}
	}
}

Autosearch.register("ui-autosearch")
Autosearch.Item.register("ui-autosearch-item")
export default Autosearch