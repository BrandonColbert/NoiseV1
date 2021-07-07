import Graph from "../../core/nodes/graph.js"
import View from "../view.js"
import GraphElement from "../elements/graphElement.js"

export class GraphView implements View {
	public readonly element: HTMLElement
	public readonly elements: GraphView.Elements

	public constructor(element: HTMLElement) {
		this.element = element
		this.elements = new GraphView.Elements(this)
	}

	public get graph(): Graph {
		return this.elements.graph?.value
	}

	public set graph(value: Graph) {
		if(value == this.elements.graph?.value)
			return

		while(this.elements.connections.lastChild)
			this.elements.connections.lastChild.remove()

		this.elements.graph?.remove()

		if(!value) {
			this.elements.graph = null
			return
		}

		this.elements.graph = new GraphElement(value, this.elements.connections)
		this.element.append(this.elements.graph)
	}

	public construct(): void {}

	public deconstruct(): void {
		this.graph = null
	}
}

export namespace GraphView {
	export class Elements extends View.Children {
		public readonly connections: SVGElement
		public graph: GraphElement

		public constructor(view: GraphView) {
			super(view)
			this.connections = this.querySelector("svg")
		}
	}
}

export default GraphView