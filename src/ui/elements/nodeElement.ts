import TextUtils from "../../utils/textUtils.js"
import Graph from "../../core/nodes/graph.js"
import UIElement from "../uiElement.js"
import GraphElement from "./graphElement.js"
import FieldsetElement from "./node/fieldsetElement.js"
import InputFieldElement from "./node/inputFieldElement.js"
import OptionFieldElement from "./node/optionFieldElement.js"
import OutputFieldElement from "./node/outputFieldElement.js"
import * as GraphActions from "../actions/graphActions.js"
import Dropdown from "../dropdown.js"

export default class NodeElement extends UIElement {
	public readonly value: Graph.Node
	public readonly name: HTMLElement
	public inputs: FieldsetElement<InputFieldElement>
	public outputs: FieldsetElement<OutputFieldElement>
	public options: FieldsetElement<OptionFieldElement>
	private onMove: (event: MouseEvent) => void

	public constructor(node: Graph.Node) {
		super()
		this.value = node

		this.id = node.id

		this.name = document.createElement("div")
		this.name.id = "name"
		this.append(this.name)

		this.append(this.inputs = new FieldsetElement("inputs", InputFieldElement))
		this.append(this.outputs = new FieldsetElement("outputs", OutputFieldElement))
		this.append(this.options = new FieldsetElement("options", OptionFieldElement))
	}

	public get graph(): GraphElement {
		return this.parentElement as GraphElement
	}

	public get position(): [number, number] {
		let style = getComputedStyle(this)

		return [
			parseInt(style.getPropertyValue("--x").slice(0, -2)),
			parseInt(style.getPropertyValue("--y").slice(0, -2))
		]
	}

	public set position(value: [number, number]) {
		let [x, y] = value
		this.style.setProperty("--x", `${x}px`)
		this.style.setProperty("--y", `${y}px`)

		this.visualizeConnections()
	}

	public visualizeConnections(): void {
		for(let field of this.inputs)
			field.visualize()

		for(let field of this.outputs)
			field.visualize()
	}

	protected override attached(): void {
		UIElement.restrict(this.parentNode, GraphElement)

		this.name.textContent = TextUtils.transformToName(this.value.name)
		this.position = this.value.position

		this.name.addEventListener("contextmenu", this.onContextMenu)
		this.name.addEventListener("mousedown", this.onStartMove)
		this.addEventListener("mousedown", this.onSelfMouseDown)
	}

	protected override detached(): void {
		this.name.addEventListener("contextmenu", this.onContextMenu)
		this.name.removeEventListener("mousedown", this.onStartMove)
		this.removeEventListener("mousedown", this.onSelfMouseDown)

		if(this.onMove) {
			this.graph.removeEventListener("mousemove", this.onMove)
			this.graph.removeEventListener("mouseup", this.onStopMove)
			this.graph.removeEventListener("mouseleave", this.onStopMove)
		}
	}

	private onStartMove = (startEvent: MouseEvent) => {
		startEvent.stopPropagation()

		this.graph.append(this)

		let [initialX, initialY] = this.position

		this.onMove = moveEvent => {
			let [deltaX, deltaY] = [
				moveEvent.clientX - startEvent.clientX,
				moveEvent.clientY - startEvent.clientY
			]

			this.position = [
				initialX + deltaX,
				initialY + deltaY
			]
		}

		this.graph.addEventListener("mousemove", this.onMove)
		this.graph.addEventListener("mouseup", this.onStopMove)
		this.graph.addEventListener("mouseleave", this.onStopMove)
	}

	private onStopMove = (_: MouseEvent) => {
		this.graph.removeEventListener("mousemove", this.onMove)
		this.graph.removeEventListener("mouseup", this.onStopMove)
		this.graph.removeEventListener("mouseleave", this.onStopMove)
		this.onMove = undefined

		let [x1, y1] = this.value.position
		let [x2, y2] = this.position

		if(x1 == x2 && y1 == y2)
			return

		this.graph.execute(new GraphActions.Move(this, this.position))
	}

	private onSelfMouseDown = (e: MouseEvent) => e.stopPropagation()

	private onContextMenu = (e: MouseEvent) => {
		e.preventDefault()

		Dropdown.show([
			// {text: "Duplicate"},
			{text: "Delete", callback: () => this.graph.execute(new GraphActions.Delete(this))}
		], {position: [`${e.clientX}px`, `${e.clientY}px`]})
	}
}

NodeElement.register("ui-node")