import NodeElement from "../elements/nodeElement.js"
import GraphAction from "./graphAction.js"

export default abstract class NodeAction extends GraphAction {
	protected readonly id: string

	public constructor(node: NodeElement) {
		super(node.graph)
		this.id = node.value.id
	}

	protected get node(): NodeElement {
		return this.graph.get(this.id)
	}
}