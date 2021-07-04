import Graph from "./graph.js"

export default class PropertyNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("target")
		this.addOutputField("value")
		this.addOptionField("key")
	}

	protected async process(): Promise<void> {
		let target = this.getInput("target")
		let key = this.getOption("key")

		this.setOutput("value", target[key])
	}
}