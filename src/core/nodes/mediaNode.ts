import Graph from "./graph.js"

export default class MediaNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addOptionField("selectors")
	}

	protected async process(): Promise<void> {}
}