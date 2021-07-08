import Graph from "./graph.js"

export default class BooleanFalseNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOutputField("value", {type: "Boolean"})
	}

	protected async process(): Promise<void> {
		this.setOutput("value", false)
	}
}