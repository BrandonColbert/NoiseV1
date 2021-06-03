import Generate from "../utils/generate.js"
import Dispatcher from "../utils/dispatcher.js"

/**
 * A List with children that can be re-ordered through Drag & Drop
 */
export default class DDListElement extends HTMLElement {
	private static image: HTMLImageElement = new Image()

	public readonly events: Dispatcher<Events>

	/** Used to acquire data from drops */
	public dataBind: (index: number) => any

	private observer: MutationObserver
	private observing: boolean = false

	private activeElement: HTMLElement
	private moveCancel: () => void

	public constructor() {
		super()
		this.events = new Dispatcher<Events>(["drop", "reorder", "transfer"])

		;[...this.children].forEach(this.include)

		this.observer = new MutationObserver(this.onMutate)
		this.enable()
	}

	public get id(): string {
		if(!super.id)
			super.id = `ddl_${Generate.uuid()}`

		return super.id
	}

	/**
	 * Enables reordering of target's children
	 */
	public enable(): void {
		if(this.observing)
			return

		this.observing = true
		this.observer.observe(this, {childList: true})
	}

	/**
	 * Disables reordering of the target's children
	 */
	public disable(): void {
		if(!this.observing)
			return

		this.observer.disconnect()
		this.observing = false
	}

	public static define(): void {
		customElements.define("dd-list", DDListElement)
	}

	private onMutate = (mutations: MutationRecord[], _: MutationObserver): void => {
		for(let mutation of mutations) {
			switch(mutation.type) {
				case "childList":
					mutation.addedNodes.forEach(this.include)
					mutation.removedNodes.forEach(this.exclude)
					break
			}
		}
	}

	private include = (target: HTMLElement): void => {
		target = DDListElement.underview(target)

		target.draggable = true
		target.addEventListener("dragstart", this.onChildDrag)
		target.addEventListener("drop", this.onDropIntoChild)
		target.addEventListener("dragenter", this.onChildDragEnter)
		target.addEventListener("dragend", this.onChildDragEnd)
		target.addEventListener("dragover", this.onChildDragOver)
	}

	private exclude = (target: HTMLElement): void => {
		target = DDListElement.underview(target)

		target.draggable = false
		target.removeEventListener("dragstart", this.onChildDrag)
		target.removeEventListener("drop", this.onDropIntoChild)
		target.removeEventListener("dragenter", this.onChildDragEnter)
		target.removeEventListener("dragend", this.onChildDragEnd)
		target.removeEventListener("dragover", this.onChildDragOver)
	}

	private onChildDrag = (event: DragEvent): void => {
		event.dataTransfer.dropEffect = "move"
		event.dataTransfer.effectAllowed = "move"
		event.dataTransfer.setDragImage(DDListElement.image, 0, 0)
		;(event.target as HTMLElement).classList.add("reorderTarget")
		
		let target = DDListElement.overview(event.target as HTMLElement)
		let startIndex = [...this.children].indexOf(target)

		this.activeElement = target
		this.moveCancel = () => {
			let endIndex = [...this.children].indexOf(target)
			let index = endIndex > startIndex ? startIndex : startIndex + 1

			this.insertBefore(
				target,
				index < this.children.length ? this.children[index] : null
			)
		}

		event.dataTransfer.setData(
			"text/plain",
			JSON.stringify({
				selector: `#${this.id}`,
				index: startIndex,
				data: this.dataBind ? this.dataBind(startIndex) : {}
			})
		)
	}

	private onDropIntoChild = async (event: DragEvent): Promise<void> => {
		let info: any

		try {
			info = JSON.parse(event.dataTransfer.getData("text/plain"))
		} catch(_) {
			return
		}

		if(!(
			"selector" in info
			&& "index" in info
			&& "data" in info
		))
			return

		let sourceList = document.querySelector<DDListElement>(info.selector)
		sourceList.activeElement = null

		if(sourceList == this) { //Reorder within list
			let target = DDListElement.overview(event.target as HTMLElement)
			let targetIndex = [...this.children].indexOf(target)
			let sourceIndex = info.index as number

			if(sourceIndex == targetIndex)
				return

			await this.events.fire("reorder", {
				from: sourceIndex,
				to: targetIndex,
				cancel: this.moveCancel
			})
		} else { //Transfer to this list
			let canceled = false
			let target = DDListElement.overview(event.target as HTMLElement)
			let targetList = target?.parentElement as DDListElement

			if(!target)
				return

			await targetList.events.fire("drop", {
				index: [...targetList.children].indexOf(target),
				data: info.data,
				cancel: () => canceled = true
			})

			if(canceled) {
				sourceList.moveCancel()
				return
			}

			await sourceList.events.fire("transfer", {
				index: info.index,
				target: targetList
			})
		}
	}

	private onChildDragEnter = (event: DragEvent): void => {
		let children = [...this.children]
		let active = DDListElement.overview(this.activeElement)
		let target = DDListElement.overview(event.target as HTMLElement)

		let activeIndex = children.indexOf(active)
		let targetIndex = children.indexOf(target)

		if(activeIndex == targetIndex || activeIndex == -1 || targetIndex == -1)
			return

		this.insertBefore(
			active,
			activeIndex < targetIndex ? target.nextElementSibling : target
		)
	}

	private onChildDragEnd = (event: DragEvent): void => {
		if(this.activeElement)
			this.moveCancel()
		
		this.activeElement = null
		;(event.target as HTMLElement).classList.remove("reorderTarget")
	}

	private onChildDragOver = (event: DragEvent): void => event.preventDefault()

	private static underview(target: HTMLElement): HTMLElement {
		switch(true) {
			case target instanceof HTMLDetailsElement:
				return target.querySelector("summary")
			default:
				return target
		}
	}

	private static overview(target: HTMLElement): HTMLElement {
		if(!target)
			return null

		if(target.parentElement instanceof DDListElement)
			return target

		return target.closest("dd-list > *")
	}
}

interface ReorderEvent {
	/** Starting index of the reordered element */
	from: number

	/** Ending index of the reordered element */
	to: number

	/** Cancels the element being reordered */
	cancel(): void
}

interface DropEvent {
	/** Index for the element to be placed */
	index: number

	/** Dropped data */
	data: any

	/** Stops the drop and prevents a transfer event */
	cancel(): void
}

interface TransferEvent {
	/** Index of the element being transferred */
	index: number

	/** List which the element was transferred to */
	target: DDListElement
}

interface Events {
	reorder: ReorderEvent
	drop: DropEvent
	transfer: TransferEvent
}