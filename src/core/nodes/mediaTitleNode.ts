import Graph from "./graph.js"

export default class MediaTitleNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("title", {type: "String"})
	}

	protected async process(): Promise<void> {}
}