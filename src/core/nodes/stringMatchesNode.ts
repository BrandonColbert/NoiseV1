import Graph from "./graph.js"

export default class StringMatchesNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("text", {type: "String"})
		this.addOutputField("result", {type: "Boolean"})
		this.addOptionField("pattern")
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("text")
		let pattern = this.getOption("pattern")

		this.setOutput("result", new RegExp(pattern, "g").test(text))
	}
}