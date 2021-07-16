import * as GraphActions from "../../../ui/actions/graphActions.js"
import Graph from "../../../core/nodes/graph.js"
import ConnectionFieldElement from "./connectionFieldElement.js"
import OutputFieldElement from "./outputFieldElement.js"

export class InputFieldElement extends ConnectionFieldElement {
	private connector: InputFieldElement.Connector

	public constructor(name: string) {
		super(name)
	}

	public get supplier(): Graph.Node.FieldReference {
		return this.fieldset.node.value.getSupplier(this.name)
	}

	public getDescription(): Graph.Node.InputDescription {
		return this.fieldset.node.value.getInputDescription(this.name)
	}

	public visualize(): void {
		this.connector.visualize()
	}

	protected override attached(): void {
		super.attached()

		if(this.getDescription().optional) {
			let typeText = this.displayName.querySelector("div")

			if(!typeText) {
				typeText = document.createElement("div")
				typeText.textContent = `()`
				this.displayName.append(typeText)
			}

			typeText.textContent = `${typeText.textContent.slice(0, -1)}?${typeText.textContent.slice(-1)}`
		}

		this.connector = new InputFieldElement.Connector(this)
		this.fieldset.node.graph.connections.append(this.connector.element)
		this.visualize()

		this.notch.addEventListener("contextmenu", this.onNotchContextMenu)
		this.notch.addEventListener("mousedown", this.onNotchMouseDown)
	}

	protected override detached(): void {
		super.detached()

		this.connector?.element.remove()
		this.connector = null

		this.notch.removeEventListener("contextmenu", this.onNotchContextMenu)
		this.notch.removeEventListener("mousedown", this.onNotchMouseDown)
	}

	private onNotchContextMenu = (e: MouseEvent) => {
		e.preventDefault()
		this.notch.blur()

		this.fieldset.node.graph.execute(new GraphActions.Connect(
			this.fieldset.node.graph,
			this.reference
		))
	}

	private onNotchMouseDown = (downEvent: MouseEvent) => {
		if(downEvent.button != 0)
			return

			let source: OutputFieldElement
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
	
					if(notch.parentElement instanceof OutputFieldElement) {
						let output = notch.parentElement as OutputFieldElement
	
						if(Graph.Node.isValidConnection(output.reference, this.reference)) {
							source = output
							line.style.stroke = ""
	
							return
						}
					}
				}
	
				source = null
				line.style.stroke = "var(--color-accent)"
			}
	
			upListener = () => {
				clear()
	
				if(!source)
					return
	
				this.fieldset.node.graph.execute(new GraphActions.Connect(
					this.fieldset.node.graph,
					this.reference,
					source.reference
				))
			}
	
			moveListener = moveEvent => {
				let [x, y] = this.notchPosition
	
				if(source) {
					let [x2, y2] = source.notchPosition
	
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

export namespace InputFieldElement {
	export class Connector {
		public readonly element: SVGPathElement
		private readonly input: InputFieldElement

		public constructor(input: InputFieldElement) {
			this.input = input
			this.element = document.createElementNS("http://www.w3.org/2000/svg", "path")
			this.element.id = this.id
		}

		public get id(): string {
			return `${this.input.reference.node.id}:${this.input.reference.fieldName}`
		}

		public visualize(): void {
			if(!this.input.supplier) {
				this.element.removeAttribute("d")
				return
			}

			let {node: sourceNode, fieldName: sourceField} = this.input.supplier
			let sourceNodeElement = this.input.fieldset.node.graph.get(sourceNode.id)

			if(!sourceNodeElement)
				return

			let [xs, ys] = sourceNodeElement.outputs.getField(sourceField).notchPosition
			let [xe, ye] = this.input.notchPosition
			xs += ConnectionFieldElement.notchRadius
			xe -= ConnectionFieldElement.notchRadius
	
			let [xOffset, yOffset] = [Math.min(40, Math.abs(xe - xs) / 2), 0]
			let [x1, y1] = [xs + xOffset, ys + yOffset]
			let [x2, y2] = [xe - xOffset, ye + yOffset]

			this.element.setAttribute("d", `M ${xs} ${ys} L ${x1} ${y1} L ${x2} ${y2} L ${xe} ${ye}`)
		}
	}
}

InputFieldElement.register()
export default InputFieldElement