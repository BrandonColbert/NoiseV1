import Graph from "../../core/nodes/graph.js"
import NodeElement from "../elements/nodeElement.js"
import NodeAction from "./nodeAction.js"

export class Delete extends NodeAction {
	private data: Graph.Node.Data

	public constructor(node: NodeElement) {
		super(node)
		this.data = node.value.getData()
	}

	public execute(): void {
		this.graph.get(this.id).remove()
		this.graph.value.removeNode(this.id)

		for(let node of this.graph)
			node.visualizeConnections()
			
	}

	public reverse(): void {
		let data: Graph.Node.Data = {
			position: this.data.position,
			type: this.data.type,
			options: this.data.options
		}

		let ctor = this.graph.value.getNodeConstructor(this.data.type)
		let node = new ctor(this.graph.value, data, this.id)
		this.graph.value.addNode(node)

		for(let [consumerField, [supplierId, supplierField]] of Object.entries(this.data.input ?? {}))
			this.graph.get(supplierId).value.connect(supplierField, node, consumerField)

		for(let [supplierField, consumers] of Object.entries(this.data.output ?? {})) {
			for(let [consumerId, consumerFields] of Object.entries(consumers)) {
				let consumerNode = this.graph.get(consumerId).value

				for(let consumerField of consumerFields)
					node.connect(supplierField, consumerNode, consumerField)
			}
		}

		this.graph.append(new NodeElement(node))

		for(let node of this.graph)
			node.visualizeConnections()
	}
}