import Graph from "./graph.js"

export default class CourierNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOutputField("query", {type: "String"})
	}

	protected async process(): Promise<void> {
		this.setOutput("query", this.getInput("query"))
	}
}