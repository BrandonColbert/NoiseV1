import Graph from "./graph.js"

export default class PlayerNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOutputField("url", {type: "String"})
	}

	protected async process(): Promise<void> {
		this.setOutput("url", this.getInput("url"))
	}
}