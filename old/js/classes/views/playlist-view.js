import Playlist from "../playlist.js"
import Noise from "../noise.js"
import ReorderList from "./reorder-list.js"
import Dropdown from "../display/dropdown.js"

const {clipboard} = require("electron")

/**
 * Visually represents and enables interaction with a playlist
 */
export default class PlaylistView extends Playlist {
	/**
	 * Default courier to use
	 * @type {string}
	 */
	selectedCourier = null

	/**
	 * Callback for item click
	 * @type {function(number):void}
	 */
	onClick = null

	/** @type {HTMLElement} */
	#nameElement
	/** @type {HTMLElement} */
	#listElement
	/** @type {Set.<number>} */
	#selectedIndices
	/** @type {number} */
	#lastSelectedIndex
	/** @type {ReorderList} */
	#reorderList

	/**
	 * @param {Playlist} playlist Source playlist
	 * @param {HTMLElement} name Name element
	 * @param {HTMLElement} list Unordered list element
	 */
	constructor(playlist, name, list) {
		super(playlist.id, playlist.info)
		this.#nameElement = name
		this.#listElement = list
		this.#selectedIndices = new Set()

		name.textContent = this.name
		
		let length = this.count

		while(list.childElementCount > length)
			list.removeChild(list.lastChild)
		while(list.childElementCount < length)
			list.appendChild(document.createElement("li"))

		for(let i = 0; i < length; i++) {
			let {query, courier} = this.getItem(i)
			let element = list.children[i]

			element.classList.remove("playingItem")
			this.#setupItemElement(element, query, courier)
		}

		this.#reorderList = new ReorderList(list)
		this.#reorderList.dragClass = "draggedItem"
		this.#reorderList.callback = this.#onReorder
	}

	get name() {
		return super.name
	}

	set name(value) {
		super.name = value
		this.#nameElement.textContent = value
	}

	get items() {
		return super.items
	}

	add(query, courier = undefined) {
		super.add(query, courier)

		let element = document.createElement("li")
		this.#setupItemElement(element, query, courier)

		this.#listElement.appendChild(element)
		this.ensureVisibility(this.count - 1)

		this.#reorderList.integrate(element)
	}

	removeAt(...indices) {
		super.removeAt(...indices)

		for(let index of indices)
			this.#listElement.children[index].remove()
	}

	setItems(...entries) {
		super.setItems(...entries)

		for(let entry of entries) {
			let [index, value] = entry
			let {query, courier} = value
			this.#setupItemElement(this.#listElement.children[index], query, courier)
		}
	}

	reset() {
		super.reset()

		for(let e of this.#listElement.children)
			e.classList.remove("playingItem")
	}

	skipTo(index) {
		let result = super.skipTo(index)

		for(let e of this.#listElement.children)
			e.classList.remove("playingItem")

		this.#listElement.children[this.index].classList.add("playingItem")

		return result
	}

	/**
	 * Ensures that the item at the index is visible to the user
	 * @param {number} index Item index
	 */
	ensureVisibility(index) {
		this.#listElement.children[index].scrollIntoView({behavior: "smooth", block: "nearest"})
	}

	/**
	 * Selectively show the elements that return true and hide those that return false
	 * @param {function(import("../playlist").Item):boolean} predicate 
	 */
	selectiveShow(predicate) {
		for(let i = 0; i < this.count; i++) {
			let item = this.getItem(i)
			let element = this.#listElement.children[i]

			element.style.display = predicate(item) ? null : "none"
		}
	}

	/**
	 * @param {HTMLElement} element 
	 * @param {string} query
	 * @param {string} identifier
	 */
	#setupItemElement = (element, query, identifier = undefined) => {
		element.textContent = query
		element.tabIndex = -1

		if(identifier)
			element.title = `${query}\n\n${Noise.loadCourier(identifier).name}`

		const blurListener = e => {
			if(e.relatedTarget?.parentNode == this.#listElement)
				return

			this.#lastSelectedIndex = NaN
			this.#deselect(...this.#selectedIndices)
		}

		element.addEventListener("dragstart", () => {
			this.#lastSelectedIndex = NaN
			this.#deselect(...this.#selectedIndices)
		})

		element.addEventListener("click", e => {
			if(window.getSelection().anchorNode?.parentNode == e.target)
				return

			let index = Array.from(this.#listElement.children).indexOf(e.target)

			if(e.ctrlKey || e.shiftKey) {
				if(e.ctrlKey) {
					this.#lastSelectedIndex = index

					if(this.#selectedIndices.has(index))
						this.#deselect(index)
					else
						this.#select(index)
				} else {
					if(isNaN(this.#lastSelectedIndex))
						this.#lastSelectedIndex = index

					let [from, to] = [Math.min(index, this.#lastSelectedIndex), Math.max(index, this.#lastSelectedIndex)]

					for(let i = 0; i < this.count; i++) {
						if(from <= i && i <= to)
							this.#select(i)
						else
							this.#deselect(i)
					}
				}

				element.addEventListener("blur", blurListener, {once: true})
				element.focus()
			} else {
				this.#lastSelectedIndex = NaN
				this.#deselect(...this.#selectedIndices)

				if(this.onClick)
					this.onClick(index)
			}
		})

		element.addEventListener("contextmenu", e => {
			let indices = new Set(this.#selectedIndices)
			indices.add(Array.from(this.#listElement.children).indexOf(e.target))

			element.addEventListener("blur", blurListener, {once: true})
			Dropdown.create([
				{
					text: "Get link",
					callback: async () => {
						let item = this.getItem(Array.from(this.#listElement.children).indexOf(e.target))
						let courier = Noise.loadCourier(item.courier ?? this.selectedCourier)
						let candidates = await courier.find(item.query)

						if(candidates.length > 0)
							clipboard.writeText(candidates[0].url)
					}
				},
				{
					text: "Copy",
					callback: () => clipboard
						.writeText(this.items.filter((_, i) => indices.has(i))
						.map(e => e.query)
						.join("\n"))
				},
				{
					text: "Edit",
					callback: () => {
						let listener = e => {
							switch(e.keyCode) {
								case 13: //Enter
									if(e.target.textContent.length > 0) {
										let index = Array.from(this.#listElement.children).indexOf(e.target)
										let item = this.getItem(index)
										item.query = e.target.textContent
										this.setItems([index, item])
									}
								case 27: //Exit
									e.target.blur()
									break
							}
						}

						e.target.addEventListener("keydown", listener)
						e.target.addEventListener("blur", () => {
							e.target.contentEditable = false
							e.target.textContent = this.getItem(Array.from(e.target.parentNode.children).indexOf(e.target)).query
							e.target.removeEventListener("keydown", listener)
						}, {once: true})

						e.target.contentEditable = true
						e.target.focus()
					}
				},
				{
					text: "Courier",
					callback: () => {
						if(this.selectedCourier)
							this.setItems([...indices].map(e => {
								let item = this.getItem(e)
								item.courier = this.selectedCourier

								return [e, item]
							}))
					}
				},
				{
					text: "Delete",
					callback: () => this.removeAt(...[...indices].sort((a, b) => a - b).reverse())
				}
			], {position: [`${e.clientX}px`, `${e.clientY}px`]})
		})
	}

	/**
	 * @param  {...number} indices 
	 */
	#select = (...indices) => {
		for(let i of indices) {
			this.#selectedIndices.add(i)
			this.#listElement.children[i].classList.add("selectedItem")
		}
	}

	/**
	 * @param  {...number} indices 
	 */
	#deselect = (...indices) => {
		for(let i of indices) {
			this.#selectedIndices.delete(i)
			this.#listElement.children[i].classList.remove("selectedItem")
		}
	}

	/**
	 * @param {number} from 
	 * @param {number} to 
	 */
	#onReorder = (from, to) => {
		let items = this.items
		let item = items[from]

		items.splice(from, 1)
		items.splice(to, 0, item)

		this.setItems(...items.map((e, i) => [i, e]))

		let selected = this.#listElement.querySelector(".playingItem")
		if(selected)
			this.skipTo(Array.from(this.#listElement.children).indexOf(selected))
	}
}