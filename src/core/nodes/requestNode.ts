import Graph from "./graph.js"

export default class RequestNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addOutputField("query", {type: "String"})
	}

	protected async process(): Promise<void> {
		this.setOutput("query", this.getInput("query"))
	}
}