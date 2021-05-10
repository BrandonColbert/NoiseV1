import {clipboard} from "electron"
import PlayableList from "../core/playlist/playable-list.js"
import Reorderable, {ReorderEvent} from "./reorderable.js"
import PlaylistEvents from "../core/playlist/events.js"
import Item from "../core/playlist/item.js"
import Courier from "../core/courier/courier.js"
import Dropdown from "./dropdown.js"
import Stylist from "../utils/stylist.js"

/**
 * Visually represents and enables interaction with a playlist
 */
export default class PlaylistView<T extends Events = Events> extends PlayableList<T> {
	static style: Style = {
		playing: "playingItem",
		selected: "selectedItem"
	}

	/** Default courier to use */
	selectedCourier: string

	#nameElement: HTMLElement
	#listElement: HTMLElement
	#reorderList: Reorderable
	#selectedIndices: Set<number>
	#lastSelectedIndex: number

	constructor(id: string, name: HTMLElement, list: HTMLUListElement) {
		super(id)
		this.#nameElement = name
		this.#listElement = list
		this.#selectedIndices = new Set<number>()

		this.registerEvent("click")

		let length = this.count

		while(list.childElementCount > length)
			list.removeChild(list.lastChild)
		while(list.childElementCount < length)
			list.append(document.createElement("li"))

		let items = this.info.items

		for(let i = 0; i < length; i++) {
			let element = list.children[i] as HTMLElement
			Stylist.remove(element, PlaylistView.style, "playing")
			this.bindItem(element, items[i])
		}

		this.#reorderList = new Reorderable(list)
		this.#reorderList.on("reorder", this.#onItemReorder)
		name.textContent = this.name
	}

	async setName(value: string): Promise<void> {
		await super.setName(value)
		this.#nameElement.textContent = value
	}

	async add(item: Item): Promise<void> {
		await super.add(item)

		let element = document.createElement("li")
		this.bindItem(element, item)

		this.#listElement.append(element)
		this.scrollIntoView(this.count - 1)
	}

	async removeAt(...indices: number[]): Promise<void> {
		await super.removeAt(...indices)

		for(let index of indices.sort((a, b) => b - a))
			this.#listElement.children[index].remove()
	}

	async setItems(...entries: [number, Item][]): Promise<void> {
		await super.setItems(...entries)

		for(let entry of entries) {
			let [index, item] = entry
			this.bindItem(this.#listElement.children[index] as HTMLElement, item)
		}
	}

	reset(): void {
		super.reset()

		for(let e of this.#listElement.children)
			Stylist.remove(e, PlaylistView.style, "playing")
	}

	skipTo(index: number): Item {
		let result = super.skipTo(index)

		for(let e of this.#listElement.children)
			Stylist.remove(e, PlaylistView.style, "playing")

		Stylist.add(this.#listElement.children[this.index], PlaylistView.style, "playing")

		return result
	}

	/**
	 * Selectively show the elements
	 * @param predicate Returns true to show an element or false to hide it
	 */
	exhibit(predicate: (item: Item) => boolean) {
		let items = this.info.items

		for(let i = 0; i < this.count; i++) {
			let element = this.#listElement.children[i] as HTMLElement
			element.style.display = predicate(items[i]) ? null : "none"
		}
	}

	/**
	 * Selects playlist items by index 
	 * @param indices Indices of the items to be selected
	 */
	select(...indices: number[]) {
		for(let i of indices) {
			this.#selectedIndices.add(i)
			Stylist.add(this.#listElement.children[i], PlaylistView.style, "selected")
		}
	}

	/**
	 * Deselects playlist items by index 
	 * @param indices Indices of the items to be deselected
	 */
	deselect(...indices: number[]) {
		for(let i of indices) {
			this.#selectedIndices.delete(i)
			Stylist.remove(this.#listElement.children[i], PlaylistView.style, "selected")
		}
	}

	/**
	 * Ensures that the item at the index if visible to the user
	 * @param index Item index
	 */
	scrollIntoView(index: number) {
		this.#listElement.children[index].scrollIntoView({behavior: "smooth", block: "nearest"})
	}

	/**
	 * Binds an item to an element
	 */
	private async bindItem(element: HTMLElement, item: Item): Promise<void> {
		element.textContent = item.query
		element.tabIndex = -1

		if(item.courier) {
			let courier = await Courier.from(item.courier)
			element.title = `${item.query}\n\n${courier.name}`
		}

		element.addEventListener("dragstart", this.#onItemDragStart)
		element.addEventListener("click", this.#onItemClick)
		element.addEventListener("contextmenu", this.#onItemContextMenu)
	}

	#onItemDragStart = (event: DragEvent): void => {
		this.#lastSelectedIndex = NaN
		this.deselect(...this.#selectedIndices)
	}

	#onItemClick = async (event: MouseEvent): Promise<void> => {
		let target = event.target as HTMLElement

		if(window.getSelection().anchorNode?.parentNode == target)
			return

		let index = [...this.#listElement.children].indexOf(target)

		if(event.ctrlKey || event.shiftKey) {
			if(event.ctrlKey) {
				this.#lastSelectedIndex = index

				if(this.#selectedIndices.has(index))
					this.deselect(index)
				else
					this.select(index)
			} else {
				if(isNaN(this.#lastSelectedIndex))
					return

				let [from, to] = [
					Math.min(index, this.#lastSelectedIndex),
					Math.max(index, this.#lastSelectedIndex)
				]

				for(let i = 0; i < this.count; i++) {
					if(from <= i && i <= to)
						this.select(i)
					else
						this.deselect(i)
				}
			}

			target.addEventListener("blur", this.#onItemBlur, {once: true})
			target.focus()
		} else {
			this.#lastSelectedIndex = NaN
			this.deselect(...this.#selectedIndices)
			await this.fire("click", {index: index})
		}
	}

	#onItemBlur = (event: FocusEvent): void => {
		let relatedTarget = event.relatedTarget as HTMLElement
		if(relatedTarget?.parentNode == this.#listElement)
			return

		this.#lastSelectedIndex = NaN
		this.deselect(...this.#selectedIndices)
	}

	#onItemContextMenu = (event: MouseEvent): void => {
		let target = event.target as HTMLElement
		target.addEventListener("blur", this.#onItemBlur, {once: true})

		let indices = new Set(this.#selectedIndices)
		indices.add([...this.#listElement.children].indexOf(target))

		Dropdown.show([
			{
				text: "Get link",
				callback: async () => {
					let item = this.getItem([...this.#listElement.children].indexOf(target))
					let courier = await Courier.from(item.courier)
					let candidates = await courier.find(item.query)

					if(candidates.length == 0)
						return

					clipboard.writeText(candidates[0].url)
				}
			},
			{
				text: "Copy",
				callback: () => clipboard.writeText(
					this.info.items
						.filter((_, i) => indices.has(i))
						.map(e => e.query)
						.join("\n")
				)
			},
			{
				text: "Edit",
				callback: () => {
					target.addEventListener("keydown", this.#onItemEditKeyDown)
					target.addEventListener("blur", this.#onItemEditBlur, {once: true})

					target.contentEditable = "true"
					target.focus()
				}
			},
			{
				text: "Courier",
				callback: async () => {
					if(!this.selectedCourier)
						return

					await this.setItems(...[...indices].map<[number, Item]>(i => {
						let item = this.getItem(i)
						item.courier = this.selectedCourier

						return [i, item]
					}))
				}
			}
		], {position: [`${event.clientX}px`, `${event.clientY}px`]})
	}

	#onItemEditKeyDown = async (event: KeyboardEvent): Promise<void> => {
		let target = event.target as HTMLElement

		switch(event.keyCode) {
			case 13: //Enter
				if(target.textContent.length == 0) {
					target.blur()
					break
				}

				let index = [...this.#listElement.children].indexOf(target)
				let item = this.getItem(index)
				item.query = target.textContent
				await this.setItems([index, item])
				break
			case 27: //Exit
				target.blur()
				break
		}
	}

	#onItemEditBlur = (event: FocusEvent): void => {
		let target = event.target as HTMLElement
		target.contentEditable = "false"
		target.textContent = this.getItem([...target.parentNode.children].indexOf(target)).query
		target.removeEventListener("keydown", this.#onItemEditKeyDown)
	}

	#onItemReorder = async (event: ReorderEvent): Promise<void> => {
		let items = this.info.items
		let item = items[event.from]

		items.splice(event.from, 1)
		items.splice(event.to, 0, item)

		await this.setItems(...items.map<[number, Item]>((e, i) => [i, e]))

		let selected = this.#listElement.querySelector(`.${PlaylistView.style.playing}`)
		if(!selected)
			return

		this.skipTo(Array.from(this.#listElement.children).indexOf(selected))
	}
}

interface ClickEvent {
	/** Index of the clicked item */
	index: number
}

export interface Events extends PlaylistEvents {
	click: ClickEvent
}

interface Style {
	/** Element being played */
	playing: string

	/** Selected element */
	selected: string
}