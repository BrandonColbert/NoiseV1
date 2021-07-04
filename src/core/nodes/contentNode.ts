import PageContent from "../../utils/pageContent.js"
import Graph from "./graph.js"

export default class ContentNode extends Graph.Node {
	public constructor(...args: ConstructorParameters<typeof Graph.Node>) {
		super(...args)
		this.addInputField("url", {type: "String"})
		this.addOutputField("root", {type: "Element"})
	}

	protected async process(): Promise<void> {
		let pageContent = await PageContent.fetch(this.getInput<string>("url"))
		this.setOutput("root", pageContent.rootElement)
	}
}