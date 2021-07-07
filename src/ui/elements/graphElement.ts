import Recall from "../../utils/recall.js"
import Graph from "../../core/nodes/graph.js"
import GraphAction from "../actions/graphAction.js"
import UIElement from "../uiElement.js"
import NodeElement from "./nodeElement.js"
import Dispatcher from "../../utils/dispatcher.js"
import Autosearch from "../autosearch.js"
import * as GraphActions from "../actions/graphActions.js"

export class GraphElement extends UIElement {
	public readonly events: Dispatcher<GraphElement.Events>
	public readonly value: Graph
	public readonly connections: SVGElement
	private actions: GraphElement.History
	private onPan: (event: MouseEvent) => void
	#pointer: [number, number] = [0, 0]

	public constructor(graph: Graph, connections: SVGElement) {
		super()
		this.events = new Dispatcher("execute", "reverse")
		this.value = graph
		this.connections = connections
		this.actions = new GraphElement.History(this)
	}

	/** Number of nodes in this graph */
	public get size(): number {
		return this.children.length
	}

	public get pointer(): [number, number] {
		return this.#pointer
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

		this.events.fire("execute", {action: action})
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
		this.addEventListener("mousemove", this.onMouseMove)
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
		this.removeEventListener("mousemove", this.onMouseMove)
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

	private onMouseMove = (event: MouseEvent) => {
		this.#pointer = [event.clientX, event.clientY]
	}

	private onKeyDown = async (event: KeyboardEvent) => {
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
			case " ":
				if(event.shiftKey || event.ctrlKey)
					return

				event.preventDefault()

				let [mouseX, mouseY] = this.pointer

				let result = await Autosearch.show(this.value.getNodeTypes(), {
					position: this.pointer,
					count: 6
				})

				if(!result || this.value.getNodeTypes().indexOf(result) == -1)
					break

				this.execute(new GraphActions.Create(this, result, [
					mouseX - this.offsetLeft - this.pan[0],
					mouseY - this.offsetTop - this.pan[1]
				]))

				break
		}
	}
}

export namespace GraphElement {
	export class History extends Recall {
		private readonly graph: GraphElement

		public constructor(graph: GraphElement) {
			super()
			this.graph = graph
		}

		public override undo(): Recall.Action {
			let action = super.undo()

			if(!action)
				return null

			this.graph.events.fire("execute", {action: action})

			return action
		}

		public override redo(): Recall.Action {
			let action = super.redo()

			if(!action)
				return null

			this.graph.events.fire("reverse", {action: action})

			return action
		}
	}

	export interface Events {
		execute: Events.Action
		reverse: Events.Action
	}

	export namespace Events {
		export interface Action {
			/** Related action */
			action: Recall.Action
		}
	}
}

GraphElement.register("ui-graph")
export default GraphElement