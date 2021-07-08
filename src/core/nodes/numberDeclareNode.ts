import Graph from "./graph.js"

export default class NumberDeclareNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOutputField("value", {type: "Number"})
		this.addOptionField("value")
	}

	protected async process(): Promise<void> {
		this.setOutput("value", parseFloat(this.getOption("value")))
	}
}