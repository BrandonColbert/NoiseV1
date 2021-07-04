import Helper from "../../core/helper.js"
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
}

export default HelperView