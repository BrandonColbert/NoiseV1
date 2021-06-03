import Graph from "./graph.js"

export default class MediaUrlNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("url", {type: "String", name: "Url"})
	}

	protected async process(): Promise<void> {}
}