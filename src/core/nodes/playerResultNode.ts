import Graph from "./graph.js"

export default class PlayerResultNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("mediaSelectors", {type: "String", optional: true})
		this.addInputField("adSelectors", {type: "String", optional: true})
		this.addOptionField("urlPattern")
	}

	protected async process(): Promise<void> {}
}