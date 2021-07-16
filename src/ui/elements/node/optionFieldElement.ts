import TextUtils from "../../../utils/textUtils.js"
import FieldElement from "./fieldElement.js"
import * as GraphActions from "../../actions/graphActions.js"

export default class OptionFieldElement extends FieldElement {
	public readonly displayName: HTMLElement
	public readonly inputText: HTMLInputElement

	public constructor(name: string) {
		super(name)
		this.append(this.displayName = document.createElement("div"))

		this.inputText = document.createElement("input")
		this.inputText.spellcheck = false
		this.append(this.inputText)
	}

	protected override attached(): void {
		super.attached()

		let desc = this.fieldset.node.value.getOptionDescription(this.name)
		this.displayName.textContent = `${desc.name ?? TextUtils.transformToName(this.name)}`
		this.inputText.value = this.fieldset.node.value.getOption(this.name)

		this.inputText.addEventListener("change", this.onTextChange)
	}

	protected override detached(): void {
		super.detached()

		this.displayName.textContent = ""
		this.inputText.value = ""

		this.inputText.removeEventListener("change", this.onTextChange)
	}

	private onTextChange = () => this.fieldset.node.graph.execute(new GraphActions.SetOption(this, this.inputText.value))
}

OptionFieldElement.register()