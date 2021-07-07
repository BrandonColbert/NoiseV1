import Graph from "./graph.js"

export default class StringCreateNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOutputField("value", {type: "String"})
		this.addOptionField("value")
	}

	protected async process(): Promise<void> {
		this.setOutput("value", this.getOption("value"))
	}
}