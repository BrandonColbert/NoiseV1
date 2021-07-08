import Graph from "./graph.js"

export default class BranchCoalesceNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("left", {optional: true})
		this.addInputField("right", {optional: true})
		this.addOutputField("value")
	}

	protected async process(): Promise<void> {
		this.setOutput("value", this.getInput("left") ?? this.getInput("right"))
	}
}