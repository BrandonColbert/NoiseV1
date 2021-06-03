import Graph from "./graph.js"

export default class SelectorNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("rootElement", {type: "Element"})
		this.addOutputField("foundElement", {type: "Element"})
		this.addOptionField("selectors")
	}

	protected async process(): Promise<void> {
		let rootElement = this.getInput<Element>("rootElement")
		this.setOutput("foundElement", rootElement.querySelector(this.getOption("selectors")))
	}
}