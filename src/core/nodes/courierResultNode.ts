import Graph from "./graph.js"

export default class CourierResultNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("url", {type: "String"})
		this.addInputField("title", {type: "String"})
	}

	protected async process(): Promise<void> {}
}