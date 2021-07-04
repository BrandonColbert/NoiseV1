import Graph from "./graph.js"

export default class MediaNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addOptionField("selectors")
	}

	protected async process(): Promise<void> {}
}