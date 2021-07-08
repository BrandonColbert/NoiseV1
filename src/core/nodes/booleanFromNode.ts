import Graph from "./graph.js"

export default class BooleanFromNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("value")
		this.addOutputField("result", {type: "Boolean"})
	}

	protected async process(): Promise<void> {
		this.setOutput("result", Boolean(this.getInput("value")))
	}
}