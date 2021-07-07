import Graph from "../../core/nodes/graph.js"
import GraphElement from "../elements/graphElement.js"
import NodeElement from "../elements/nodeElement.js"
import GraphAction from "./graphAction.js"

export class Create extends GraphAction {
	private type: string
	private position: [number, number]
	private id: string

	public constructor(graph: GraphElement, type: string, position: [number, number]) {
		super(graph)
		this.type = type
		this.position = position
	}

	public execute(): void {
		let node: Graph.Node

		if(this.id) {
			let ctor = this.graph.value.getNodeConstructor(this.type)
			node = new ctor(this.graph.value, null, this.id)
			node.position = this.position

			this.graph.value.addNode(node)
		} else {
			node = this.graph.value.createNode(this.type)
			node.position = this.position

			this.id = node.id
		}

		this.graph.append(new NodeElement(node))
	}

	public reverse(): void {
		this.graph.get(this.id).remove()
		this.graph.value.removeNode(this.id)
	}
}