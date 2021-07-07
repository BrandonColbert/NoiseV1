import Graph from "./nodes/graph.js"
import ContentNode from "../core/nodes/contentNode.js"
import ConvertNode from "../core/nodes/convertNode.js"
import MatchNode from "../core/nodes/matchNode.js"
import PropertyNode from "../core/nodes/propertyNode.js"
import SelectorNode from "../core/nodes/selectorNode.js"
import StringInsertNode from "../core/nodes/stringInsertNode.js"
import StringCreateNode from "./nodes/stringCreateNode.js"
import StringJoinNode from "./nodes/stringJoinNode.js"

export default abstract class Helper {
	public readonly graph: Graph
	public abstract name: string

	protected constructor() {
		this.graph = new Graph()
		this.graph.registerNodeType("content", ContentNode)
		this.graph.registerNodeType("convert", ConvertNode)
		this.graph.registerNodeType("match", MatchNode)
		this.graph.registerNodeType("property", PropertyNode)
		this.graph.registerNodeType("selector", SelectorNode)
		this.graph.registerNodeType("string.insert", StringInsertNode)
		this.graph.registerNodeType("string.create", StringCreateNode)
		this.graph.registerNodeType("string.join", StringJoinNode)
	}

	public abstract save(): Promise<void>

	public abstract delete(): Promise<void>

	public abstract duplicate(): Promise<Helper>
}