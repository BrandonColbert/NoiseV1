import Graph from "./graph.js"

export default class SelectorNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("root", {type: "Element"})
		this.addOutputField("found", {type: "Element"})
		this.addOptionField("selectors")
	}

	protected async process(): Promise<void> {
		let rootElement = this.getInput<Element>("root")
		this.setOutput("found", rootElement.querySelector(this.getOption("selectors")))
	}
}