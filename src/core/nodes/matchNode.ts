import Graph from "./graph.js"

export default class MatchNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("text", {type: "String"})
		this.addOutputField("text", {type: "String"})
		this.addOptionField("pattern")
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("text")
		let regex = new RegExp(this.getOption("pattern"), "g")
		let matches = text.match(regex)

		if(matches.length == 0)
			return

		this.setOutput("text", matches[0])
	}
}