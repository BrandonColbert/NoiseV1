import Graph from "../../../core/nodes/graph.js"
import ConnectionFieldElement from "./connectionFieldElement.js"

export default class OutputFieldElement extends ConnectionFieldElement {
	public getDescription(): Graph.Node.ConnectionDescription {
		return this.fieldset.node.value.getOutputDescription(this.name)
	}

	public visualize(): void {
		for(let consumer of this.fieldset.node.value.getOutputConsumers(this.name)) {
			let targetNodeElement = this.fieldset.node.graph.get(consumer.node.id)

			if(!targetNodeElement)
				continue

			let targetFieldElement = targetNodeElement.inputs.getField(consumer.fieldName)
			targetFieldElement.visualize()
		}
	}
}

OutputFieldElement.register()