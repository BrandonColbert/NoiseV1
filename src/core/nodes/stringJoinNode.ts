import Graph from "./graph.js"

export default class StringJoinNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("left", {type: "String"})
		this.addInputField("right", {type: "String"})
		this.addOutputField("result", {type: "String"})
		this.addOptionField("separator", {defaultValue: ""})
	}

	protected async process(): Promise<void> {
		let left = this.getInput<string>("left")
		let right = this.getInput<string>("right")
		let separator = this.getOption("separator")
		this.setOutput("result", `${left}${separator}${right}`)
	}
}