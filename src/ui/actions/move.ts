import NodeElement from "../elements/nodeElement.js"
import NodeAction from "./nodeAction.js"

export class Move extends NodeAction {
	private initialPosition: [number, number]
	private finalPosition: [number, number]

	public constructor(node: NodeElement, position: [number, number]) {
		super(node)
		this.initialPosition = node.value.position
		this.finalPosition = position
	}

	public execute(): void {
		this.apply(this.finalPosition)
	}

	public reverse(): void {
		this.apply(this.initialPosition)
	}

	private apply(position: [number, number]): void {
		this.node.value.position = position
		this.node.position = position
	}
}