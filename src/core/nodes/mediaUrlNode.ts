import Graph from "./graph.js"

export default class MediaUrlNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("url", {type: "String"})
	}

	protected async process(): Promise<void> {}
}