import Graph from "../../../core/nodes/graph.js"
import ConnectionFieldElement from "./connectionFieldElement.js"
import InputFieldElement from "./inputFieldElement.js"
import * as GraphActions from "../../actions/graphActions.js"

export default class OutputFieldElement extends ConnectionFieldElement {
	public getDescription(): Graph.Node.ConnectionDescription {
		return this.fieldset.node.value.getOutputDescription(this.name)
	}

	public visualize(): void {
		for(let consumer of this.fieldset.node.value.getConsumers(this.name)) {
			let targetNodeElement = this.fieldset.node.graph.get(consumer.node.id)

			if(!targetNodeElement)
				continue

			let targetFieldElement = targetNodeElement.inputs.getField(consumer.fieldName)
			targetFieldElement.visualize()
		}
	}

	protected override attached(): void {
		super.attached()

		this.notch.addEventListener("mousedown", this.onNotchMouseDown)
	}

	protected override detached(): void {
		super.detached()

		this.notch.removeEventListener("mousedown", this.onNotchMouseDown)
	}

	private onNotchMouseDown = (downEvent: MouseEvent) => {
		if(downEvent.button != 0)
			return

		let target: InputFieldElement
		let upListener: (e: MouseEvent) => void
		let moveListener: (e: MouseEvent) => void
		let overListener: (e: MouseEvent) => void
		let leaveListener: (e: MouseEvent) => void

		let line = document.createElementNS("http://www.w3.org/2000/svg", "path")
		this.fieldset.node.graph.connections.append(line)

		let clear = () => {
			line.remove()

			document.body.removeEventListener("mouseup", upListener)
			document.body.removeEventListener("mousemove", moveListener)
			document.body.removeEventListener("mouseover", overListener)
			document.body.removeEventListener("mouseleave", leaveListener)
		}
		
		overListener = (e: MouseEvent) => {
			if(e.target instanceof HTMLButtonElement) {
				let notch = e.target as HTMLButtonElement

				if(notch.parentElement instanceof InputFieldElement) {
					let input = notch.parentElement as InputFieldElement

					if(Graph.Node.isValidConnection(this.reference, input.reference)) {
						target = input
						line.style.stroke = ""

						return
					}
				}
			}

			target = null
			line.style.stroke = "var(--color-accent)"
		}

		upListener = () => {
			clear()

			if(!target)
				return

			this.fieldset.node.graph.execute(new GraphActions.Connect(
				this.fieldset.node.graph,
				target.reference,
				this.reference
			))
		}

		moveListener = moveEvent => {
			let [x, y] = this.notchPosition

			if(target) {
				let [x2, y2] = target.notchPosition

				line.setAttribute("d", `M ${x} ${y} L ${x2} ${y2}`)
			} else {
				let [dx, dy] = [
					moveEvent.clientX - downEvent.clientX,
					moveEvent.clientY - downEvent.clientY
				]

				line.setAttribute("d", `M ${x} ${y} l ${dx} ${dy}`)
			}
		}

		leaveListener = () => clear()

		document.body.addEventListener("mouseup", upListener)
		document.body.addEventListener("mousemove", moveListener)
		document.body.addEventListener("mouseover", overListener)
		document.body.addEventListener("mouseleave", leaveListener)
	}
}

OutputFieldElement.register()