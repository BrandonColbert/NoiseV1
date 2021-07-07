import Graph from "../../core/nodes/graph.js"
import Helper from "../../core/helper.js"
import GraphElement from "../elements/graphElement.js"
import GraphView from "./graphView.js"

export class HelperView extends GraphView {
	#helper: Helper

	public constructor(element: HTMLElement) {
		super(element)
	}

	public get helper(): Helper {
		return this.#helper
	}

	public set helper(value: Helper) {
		if(this.#helper == value)
			return

		this.#helper = value
		this.graph = value.graph
	}

	public override get graph(): Graph {
		return super.graph
	}

	public override set graph(value: Graph) {
		if(this.graph) {
			this.elements.graph.events.forget("execute", this.onGraphAction)
			this.elements.graph.events.forget("reverse", this.onGraphAction)
		}

		super.graph = value

		if(value) {
			this.elements.graph.events.on("execute", this.onGraphAction)
			this.elements.graph.events.on("reverse", this.onGraphAction)
		}
	}

	private onGraphAction = async (_: GraphElement.Events.Action) => await this.helper.save()
}

export default HelperView