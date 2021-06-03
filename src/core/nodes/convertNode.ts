import Graph from "./graph.js"

export default class ConvertNode extends Graph.Node {
	public constructor(graph: Graph, data: Graph.Node.Data = null, id: string = null) {
		super(graph, data, id)
		this.addInputField("text", {type: "String"})
		this.addOutputField("result", {type: "String"})
		this.addOptionField("action", {defaultValue: "encode"})
		this.addOptionField("format", {defaultValue: "uri"})
	}

	protected async process(): Promise<void> {
		let text = this.getInput<string>("text")
		let action = this.getOption("action")
		let format = this.getOption("format")

		switch(format) {
			case "uri":
				switch(action) {
					case "encode":
						this.setOutput("result", encodeURI(text))
						break
					case "decode":
						this.setOutput("result", decodeURI(text))
						break
				}
				break
			case "base64":
				switch(action) {
					case "encode":
						this.setOutput("result", btoa(text))
						break
					case "decode":
						this.setOutput("result", atob(text))
						break
				}
				break
		}
	}
}