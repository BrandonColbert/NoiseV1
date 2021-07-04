import NodeElement from "../elements/nodeElement.js"
import NodeAction from "./nodeAction.js"

namespace GraphActions {
	export class Move extends NodeAction {
		private initialPosition: [number, number]
		private finalPosition: [number, number]

		public constructor(node: NodeElement, position: [number, number]) {
			super(node)
			this.initialPosition = node.value.position
			this.finalPosition = position
		}

		public execute(): void {
			this.node.value.position = this.finalPosition
			this.node.position = this.finalPosition
		}

		public reverse(): void {
			this.node.value.position = this.initialPosition
			this.node.position = this.initialPosition
		}
	}
}

export default GraphActions