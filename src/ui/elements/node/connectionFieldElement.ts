import Graph from "../../../core/nodes/graph.js"
import TextUtils from "../../../utils/textUtils.js"
import FieldElement from "./fieldElement.js"

export default abstract class ConnectionFieldElement extends FieldElement {
	public static readonly notchRadius: number = 4
	public readonly displayName: HTMLElement
	public readonly notch: HTMLButtonElement

	public constructor(name: string) {
		super(name)

		this.append(this.displayName = document.createElement("div"))

		this.notch = document.createElement("button")
		this.notch.classList.add("iconic")
		this.append(this.notch)
	}

	public get reference(): Graph.Node.FieldReference {
		return {
			node: this.fieldset.node.value,
			fieldName: this.name
		}
	}

	public get notchPosition(): [number, number] {
		let rect = this.fieldset.node.getBoundingClientRect()
		let notchRect = this.notch.getBoundingClientRect()

		let [x, y] = this.fieldset.node.position
		x += (notchRect.x - rect.x) + notchRect.width / 2
		y += (notchRect.y - rect.y) + notchRect.height / 2

		return [x, y]
	}

	public abstract getDescription(): Graph.Node.ConnectionDescription

	public abstract visualize(): void

	protected override attached(): void {
		super.attached()

		let desc = this.getDescription()

		this.displayName.textContent = `${desc.name ?? TextUtils.transformToName(this.name)}`

		if(desc.type) {
			let typeText = document.createElement("div")
			typeText.textContent = `(${desc.type})`
			this.displayName.append(typeText)
		}
	}
}