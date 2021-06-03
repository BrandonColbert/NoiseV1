import Graph from "./graph.js"

export default class PropertyNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("target")
		this.addOutputField("value")
		this.addOptionField("key")
	}

	protected async process(): Promise<void> {
		let target = this.getInput("target")
		let key = this.getOption("key")

		this.setOutput("value", target[key])
	}
}