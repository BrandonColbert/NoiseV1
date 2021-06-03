import PageContent from "../../utils/pageContent.js"
import Graph from "./graph.js"

export default class ContentNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("url", {type: "String", name: "Url"})
		this.addOutputField("rootElement", {type: "Element", name: "Root Element"})
	}

	protected async process(): Promise<void> {
		let pageContent = await PageContent.fetch(this.getInput<string>("url"))
		this.setOutput("rootElement", pageContent.rootElement)
	}
}