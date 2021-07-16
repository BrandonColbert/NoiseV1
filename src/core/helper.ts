import Graph from "./nodes/graph.js"
import ContentNode from "../core/nodes/contentNode.js"
import ConvertNode from "../core/nodes/convertNode.js"
import PropertyNode from "../core/nodes/propertyNode.js"
import SelectorNode from "../core/nodes/selectorNode.js"
import StringInsertNode from "../core/nodes/stringInsertNode.js"
import StringCreateNode from "./nodes/stringCreateNode.js"
import StringJoinNode from "./nodes/stringJoinNode.js"
import BooleanTrueNode from "./nodes/booleanTrueNode.js"
import BooleanFalseNode from "./nodes/booleanFalseNode.js"
import NumberDeclareNode from "./nodes/numberDeclareNode.js"
import BranchNode from "./nodes/branchNode.js"
import BranchCoalesceNode from "./nodes/branchCoalesceNode.js"
import StringFromNode from "./nodes/stringFromNode.js"
import BooleanFromNode from "./nodes/booleanFromNode.js"
import StringMatchesNode from "./nodes/stringMatchesNode.js"
import StringSimplifyNode from "./nodes/stringSimplifyNode.js"

export default abstract class Helper {
	public readonly graph: Graph

	protected constructor() {
		this.graph = new Graph()
		this.graph.registerNodeType("content", ContentNode)
		this.graph.registerNodeType("convert", ConvertNode)
		this.graph.registerNodeType("property", PropertyNode)
		this.graph.registerNodeType("selector", SelectorNode)
		this.graph.registerNodeType("string.insert", StringInsertNode)
		this.graph.registerNodeType("string.from", StringFromNode)
		this.graph.registerNodeType("string.create", StringCreateNode)
		this.graph.registerNodeType("string.join", StringJoinNode)
		this.graph.registerNodeType("string.matches", StringMatchesNode)
		this.graph.registerNodeType("string.simplify", StringSimplifyNode)
		this.graph.registerNodeType("boolean.true", BooleanTrueNode)
		this.graph.registerNodeType("boolean.false", BooleanFalseNode)
		this.graph.registerNodeType("boolean.from", BooleanFromNode)
		this.graph.registerNodeType("number.declare", NumberDeclareNode)
		this.graph.registerNodeType("branch", BranchNode)
		this.graph.registerNodeType("branch.coalesce", BranchCoalesceNode)
	}

	public abstract get name(): string

	public abstract save(): Promise<void>

	public abstract delete(): Promise<void>

	public abstract duplicate(name?: string): Promise<Helper>
}