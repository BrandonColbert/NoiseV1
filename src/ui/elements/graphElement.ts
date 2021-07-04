import Recall from "../../utils/recall.js"
import Graph from "../../core/nodes/graph.js"
import GraphAction from "../actions/graphAction.js"
import UIElement from "../uiElement.js"
import NodeElement from "./nodeElement.js"

export default class GraphElement extends UIElement {
	public readonly value: Graph
	public readonly connections: SVGElement
	private actions: Recall
	private onPan: (event: MouseEvent) => void

	public constructor(graph: Graph, connections: SVGElement) {
		super()
		this.value = graph
		this.connections = connections
		this.actions = new Recall()
	}

	/** Number of nodes in this graph */
	public get size(): number {
		return this.children.length
	}

	public get zoom(): number {
		let style = getComputedStyle(this.parentElement)
		return parseFloat(style.getPropertyValue("--zoom"))
	}

	public set zoom(value: number) {
		// let oldZoom = this.zoom
		let newZoom = Math.max(0.5, Math.min(value, 2))

		// let rect = this.element.getBoundingClientRect()
		// let zoomDelta = newZoom - oldZoom
		// let [panX, panY] = this.pan
		// let [x, y] = [rect.width / 2, rect.height / 2]
		// this.pan = [
		// 	-(panX * zoomDelta),
		// 	panY
		// ]

		// this.parentElement.style.setProperty("--zoom", `${newZoom}`)
	}

	public get pan(): [number, number] {
		let style = getComputedStyle(this.parentElement)

		return [
			parseInt(style.getPropertyValue("--pan-x").slice(0, -2)),
			parseInt(style.getPropertyValue("--pan-y").slice(0, -2))
		]
	}

	public set pan(value: [number, number]) {
		let [panX, panY] = value
		this.parentElement.style.setProperty("--pan-x", `${panX}px`)
		this.parentElement.style.setProperty("--pan-y", `${panY}px`)
	}

	/**
	 * @param id Node id
	 * @returns Node with the specified id
	 */
	public get(id: string): NodeElement {
		return this.querySelector(`:scope > ui-node[id='${id}']`)
	}

	public execute(action: GraphAction): void {
		this.actions.record(action)
		action.execute()
	}

	public *[Symbol.iterator](): IterableIterator<NodeElement> {
		for(let child of this.children)
			yield child as NodeElement
	}

	protected override attached(): void {
		this.addEventListener("mousedown", this.onStartPan)
		this.addEventListener("mouseup", this.onStopPan)
		this.addEventListener("mouseleave", this.onStopPan)
		this.addEventListener("wheel", this.onMouseWheel)
		this.addEventListener("auxclick", this.onMouseClick)
		document.body.addEventListener("keydown", this.onKeyDown)

		for(let node of this.value)
			this.append(new NodeElement(node))

		for(let node of this)
			node.visualizeConnections()
	}

	protected override detached(): void {
		this.removeEventListener("mousedown", this.onStartPan)
		this.removeEventListener("mouseup", this.onStopPan)
		this.removeEventListener("mouseleave", this.onStopPan)
		this.removeEventListener("wheel", this.onMouseWheel)
		this.removeEventListener("auxclick", this.onMouseClick)
		document.body.removeEventListener("keydown", this.onKeyDown)

		for(let nodeElement of this)
			nodeElement.remove()
	}

	protected override onChildAttached(node: Node): void {
		UIElement.restrict(node, NodeElement)
	}

	private onStartPan = (startEvent: MouseEvent) => {
		let [panX, panY] = this.pan

		this.onPan = moveEvent => {
			let [offsetX, offsetY] = [
				moveEvent.clientX - startEvent.clientX,
				moveEvent.clientY - startEvent.clientY
			]

			this.pan = [
				panX + offsetX / this.zoom,
				panY + offsetY / this.zoom
			]
		}

		this.addEventListener("mousemove", this.onPan)
	}

	private onStopPan = (_: MouseEvent) => {
		this.removeEventListener("mousemove", this.onPan)
		this.onPan = null
	}

	private onMouseWheel = (event: WheelEvent) => {
		let deltaY = event.deltaY / Math.abs(event.deltaY)
		this.zoom *= 1 - deltaY * 0.1
	}

	private onMouseClick = (event: MouseEvent) => {
		switch(event.button) {
			case 1:
				this.zoom = 1
				break
		}
	}

	private onKeyDown = (event: KeyboardEvent) => {
		if(document.activeElement != document.body)
			return

		switch(event.key.toLowerCase()) {
			case "z":
				if(event.ctrlKey) {
					event.preventDefault()
					this.actions.undo()
				}

				break
			case "y":
				if(event.ctrlKey) {
					event.preventDefault()
					this.actions.redo()
				}

				break
		}
	}
}

GraphElement.register("ui-graph")