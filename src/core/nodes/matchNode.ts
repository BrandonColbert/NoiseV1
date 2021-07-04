import Graph from "./graph.js"

export default class MatchNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("text", {type: "String"})
		this.addOutputField("text", {type: "String"})
		this.addOptionField("pattern")
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("text")
		let regex = new RegExp(this.getOption("pattern"), "g")
		let matches = text.match(regex)

		if(!matches || matches.length == 0)
			return

		this.setOutput("text", matches[0])
	}
}