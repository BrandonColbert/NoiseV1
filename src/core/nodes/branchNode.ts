import Graph from "./graph.js"

export default class BranchNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("value")
		this.addInputField("left")
		this.addInputField("right")
		this.addOutputField("pass")
		this.addOutputField("fail")
		this.addOptionField("operator")
	}

	protected async process(): Promise<void> {
		let value = this.getInput("value")
		let left = this.getInput("left")
		let right = this.getInput("right")
		let result: boolean

		switch(this.getOption("operator")) {
			case "==": result = left == right; break
			case "!=": result = left != right; break
			case "===": result = left === right; break
			case "!==": result = left !== right; break
			case ">": result = left > right; break
			case "<": result = left < right; break
			case ">=": result = left >= right; break
			case "<=": result = left <= right; break
		}

		this.setOutput("pass", result ? value : null)
		this.setOutput("fail", result ? null : value)
	}
}