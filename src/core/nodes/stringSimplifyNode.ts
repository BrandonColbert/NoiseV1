import TextUtils from "../../utils/textUtils.js"
import Graph from "./graph.js"

export default class StringSimplifyNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("value", {type: "String"})
		this.addOutputField("result", {type: "String"})
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("value")
		this.setOutput("result", TextUtils.simplify(text))
	}
}