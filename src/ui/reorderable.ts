import Stylist from "../utils/stylist.js"
import Dispatcher from "../utils/dispatcher.js"

/**
 * Allows an element's children to be reordered by dragging
 */
export default class Reorderable extends Dispatcher<Events> {
	static style: Style = {
		reorderTarget: "reorderTarget"
	}

	/** Element whose children have been made reorderable */
	readonly element: HTMLElement

	#observer: MutationObserver
	#observing: boolean = false

	#activeElement: HTMLElement
	#startIndex: number

	#image: HTMLImageElement

	/**
	 * @param element Element whose children will become reorderable
	 */
	constructor(element: HTMLElement) {
		super()
		this.element = element
		this.#image = new Image()

		this.registerEvent("reorder")

		Array.from(element.children).forEach(this.#include)

		this.#observer = new MutationObserver(this.#onMutate)
		this.enable()
	}

	/**
	 * Enables reordering of target's children
	 */
	enable(): void {
		if(this.#observing)
			return

		this.#observing = true
		this.#observer.observe(this.element, {childList: true})
	}

	/**
	 * Disables reordering of the target's children
	 */
	disable(): void {
		if(!this.#observing)
			return

		this.#observer.disconnect()
		this.#observing = false
	}

	#onMutate = (mutations: MutationRecord[], observer: MutationObserver): void => {
		for(let mutation of mutations) {
			switch(mutation.type) {
				case "childList":
					mutation.addedNodes.forEach(this.#include)
					mutation.removedNodes.forEach(this.#exclude)
					break
			}
		}
	}

	#include = (target: HTMLElement): void => {
		target.draggable = true
		target.addEventListener("dragstart", this.#onChildDrag)
		target.addEventListener("dragover", this.#onChildDragOver)
		target.addEventListener("dragenter", this.#onChildDragEnter)
		target.addEventListener("dragend", this.#onChildDragEnd)
	}

	#exclude = (target: HTMLElement): void => {
		target.draggable = false
		target.removeEventListener("dragstart", this.#onChildDrag)
		target.removeEventListener("dragover", this.#onChildDragOver)
		target.removeEventListener("dragenter", this.#onChildDragEnter)
		target.removeEventListener("dragend", this.#onChildDragEnd)
	}

	#onChildDrag = (event: DragEvent): void => {
		event.dataTransfer.dropEffect = "move"
		event.dataTransfer.setDragImage(this.#image, 0, 0)

		let target = event.target as HTMLElement
		this.#activeElement = target
		this.#startIndex = [...this.element.children].indexOf(target)

		Stylist.add(target, Reorderable.style, "reorderTarget")
	}

	#onChildDragOver = (event: DragEvent): void => {
		event.preventDefault()
	}

	#onChildDragEnter = (event: DragEvent): void => {
		let children = [...this.element.children]
		let active = this.#activeElement
		let target = event.target as HTMLElement

		this.element.insertBefore(
			active,
			children.indexOf(active) < children.indexOf(target) ? target.nextElementSibling : target
		)
	}

	#onChildDragEnd = async (event: DragEvent): Promise<void> => {
		let target = event.target as HTMLElement

		Stylist.remove(target, Reorderable.style, "reorderTarget")

		let endIndex = [...this.element.children].indexOf(target)

		if(this.#startIndex == endIndex)
			return

		await this.fire("reorder", {
			from: this.#startIndex,
			to: endIndex
		})
	}
}

export interface ReorderEvent {
	/**
	 * Starting index of the reordered element
	 */
	from: number

	/**
	 * Ending index of the reordered element
	 */
	to: number
}

interface Events {
	reorder: ReorderEvent
}

interface Style {
	/** Element being reordered */
	reorderTarget: string
}