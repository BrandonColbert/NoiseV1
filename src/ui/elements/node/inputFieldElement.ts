import Graph from "../../../core/nodes/graph.js"
import ConnectionFieldElement from "./connectionFieldElement.js"

export class InputFieldElement extends ConnectionFieldElement {
	private connector: InputFieldElement.Connector

	public constructor(name: string) {
		super(name)
	}

	public get consumer(): Graph.Node.FieldReference {
		return {
			node: this.fieldset.node.value,
			fieldName: this.name
		}
	}

	public get supplier(): Graph.Node.FieldReference {
		return this.fieldset.node.value.getInputSupplier(this.name)
	}

	public set supplier(value: Graph.Node.FieldReference) {
		throw new Error("Not implemented")
	}

	public getDescription(): Graph.Node.ConnectionDescription {
		return this.fieldset.node.value.getInputDescription(this.name)
	}

	public visualize(): void {
		this.connector.visualize()
	}

	protected override attached(): void {
		super.attached()

		this.connector = new InputFieldElement.Connector(this)
		this.fieldset.node.graph.connections.append(this.connector.element)
	}

	protected override detached(): void {
		super.detached()

		this.connector.element.remove()
		this.connector = null
	}
}

export namespace InputFieldElement {
	export class Connector {
		private static readonly notchRadius: number = 4

		public readonly element: SVGPathElement
		private readonly input: InputFieldElement

		public constructor(input: InputFieldElement) {
			this.input = input
			this.element = document.createElementNS("http://www.w3.org/2000/svg", "path")
			this.element.id = this.id
		}

		public get id(): string {
			return `${this.input.consumer.node.id}:${this.input.consumer.fieldName}`
		}

		public visualize(): void {
			if(!this.input.supplier)
				return
	
			let {node: sourceNode, fieldName: sourceField} = this.input.supplier
			let {node: targetNode, fieldName: targetField} = this.input.consumer
	
			let sourceNodeElement = this.input.fieldset.node.graph.get(sourceNode.id)
			let targetNodeElement = this.input.fieldset.node.graph.get(targetNode.id)
	
			let sourceNotchElement = sourceNodeElement.querySelector(`#outputs > [id="${sourceField}"] > button`)
			let targetNotchElement = targetNodeElement.querySelector(`#inputs > [id="${targetField}"] > button`)
	
			let sourceRect = sourceNodeElement.getBoundingClientRect()
			let targetRect = targetNodeElement.getBoundingClientRect()
			let sourceNotchRect = sourceNotchElement.getBoundingClientRect()
			let targetNotchRect = targetNotchElement.getBoundingClientRect()
	
			let [xs, ys] = sourceNodeElement.position
			xs += (sourceNotchRect.x - sourceRect.x) + sourceNotchRect.width / 2 + Connector.notchRadius
			ys += (sourceNotchRect.y - sourceRect.y) + sourceNotchRect.height / 2
	
			let [xe, ye] = targetNodeElement.position
			xe += (targetNotchRect.x - targetRect.x) + targetNotchRect.width / 2 - Connector.notchRadius,
			ye += (targetNotchRect.y - targetRect.y) + targetNotchRect.height / 2
	
			let [xOffset, yOffset] = [Math.min(40, Math.abs(xe - xs) / 2), 0]
	
			let [x1, y1] = [xs + xOffset, ys + yOffset]
			let [x2, y2] = [xe - xOffset, ye + yOffset]
	
			// let length = Math.hypot(x2 - x1, y2 - y1) / 2
			// let angle = -Math.atan2(y2 - y1, x2 - x1)
	
			// let [cx1, cy1] = [
			// 	x1 + Math.cos(angle) * length,
			// 	y1 + Math.sin(angle) * length
			// ]
	
			// let [cx2, cy2] = [
			// 	x2 - Math.cos(angle) * length,
			// 	y2 - Math.sin(angle) * length
			// ]
	
			// connectElement.setAttribute("d", `M ${xs} ${ys} L ${xe} ${ye}`)
			this.element.setAttribute("d", `M ${xs} ${ys} L ${x1} ${y1} L ${x2} ${y2} L ${xe} ${ye}`)
			// connectElement.setAttribute("d", `M ${xs} ${ys} L ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2} L ${xe} ${ye}`)
		}
	}
}

InputFieldElement.register()
export default InputFieldElement