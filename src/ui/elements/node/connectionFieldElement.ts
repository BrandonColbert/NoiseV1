import Graph from "../../../core/nodes/graph.js"
import TextUtils from "../../../utils/textUtils.js"
import FieldElement from "./fieldElement.js"

export default abstract class ConnectionFieldElement extends FieldElement {
	public readonly displayName: HTMLElement
	public readonly notch: HTMLButtonElement

	public constructor(name: string) {
		super(name)

		this.append(this.displayName = document.createElement("div"))

		this.notch = document.createElement("button")
		this.notch.classList.add("iconic")
		this.append(this.notch)
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