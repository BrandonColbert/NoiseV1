const image = new Image()

/**
 * Enables reordering of an unsorted list through dragging
 */
export default class ReorderList {
	/**
	 * Class to apply to the dragged element
	 * @type {string}
	 */
	dragClass

	/**
	 * Callback when an item is re-ordered
	 * @type {ReorderCallback}
	 */
	callback

	/** @type {HTMLElement} */
	#listElement

	/** @type {HTMLElement} */
	#activeElement

	/** @type {HTMLElement} */
	#initialIndex

	/**
	 * @param {HTMLElement} list List container element
	 */
	constructor(list) {
		this.#listElement = list

		for(let element of list.children)
			this.integrate(element)
	}

	/**
	 * Integrates a new element
	 * @param {HTMLElement} element 
	 */
	integrate(element) {
		element.ondragstart = e => {
			e.dataTransfer.dropEffect = "move"
			e.dataTransfer.setDragImage(image, 0, 0)

			if(this.dragClass)
				e.target.classList.add(this.dragClass)

			this.#activeElement = e.target
			this.#initialIndex = Array.from(this.#listElement.children).indexOf(e.target)
		}

		element.ondragover = e => e.preventDefault()

		element.ondragenter = e => {
			let children = Array.from(this.#listElement.children)
			let active = this.#activeElement
			let target = e.target

			this.#listElement.insertBefore(
				active,
				children.indexOf(active) < children.indexOf(target) ? target.nextSibling : target
			)
		}

		element.ondragend = e => {
			if(this.dragClass)
				e.target.classList.remove(this.dragClass)

			if(this.callback) {
				let endIndex = Array.from(this.#listElement.children).indexOf(e.target)

				if(this.#initialIndex != endIndex)
					this.callback(this.#initialIndex, endIndex)
			}
		}

		element.draggable = true
	}
}

/** @typedef {function(number, number):void} ReorderCallback */