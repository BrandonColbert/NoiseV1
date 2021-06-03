import Graph from "./graph.js"

export default class StringInsertNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("text", {type: "String"})
		this.addOutputField("result", {type: "String"})
		this.addOptionField("source")
		this.addOptionField("position", {defaultValue: "0"})
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("text")
		let source = this.getOption("source")
		let position = Number(this.getOption("position"))

		this.setOutput(
			"result",
			`${source.slice(0, position)}${text}${source.slice(position)}`
		)
	}
}