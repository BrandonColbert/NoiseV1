import Graph from "./graph.js"

export default class MediaTitleNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("title", {type: "String"})
	}

	protected async process(): Promise<void> {}
}