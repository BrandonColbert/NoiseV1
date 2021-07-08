import Graph from "./graph.js"

export default class StringFromNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("value")
		this.addOutputField("result", {type: "String"})
	}

	protected async process(): Promise<void> {
		this.setOutput("result", this.getInput("value").toString())
	}
}