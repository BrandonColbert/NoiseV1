import Recall from "../../utils/recall.js"
import GraphElement from "../elements/graphElement.js"

export default abstract class GraphAction extends Recall.Action {
	protected graph: GraphElement

	public constructor(graph: GraphElement) {
		super()
		this.graph = graph
	}
}