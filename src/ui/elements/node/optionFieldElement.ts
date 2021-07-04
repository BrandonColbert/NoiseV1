import TextUtils from "../../../utils/textUtils.js"
import FieldElement from "./fieldElement.js"

export default class OptionFieldElement extends FieldElement {
	protected displayName: HTMLElement
	protected inputText: HTMLInputElement

	public constructor(name: string) {
		super(name)
		this.append(this.displayName = document.createElement("div"))
		this.append(this.inputText = document.createElement("input"))
	}

	protected override attached(): void {
		super.attached()

		let desc = this.fieldset.node.value.getOptionDescription(this.name)
		this.displayName.textContent = `${desc.name ?? TextUtils.transformToName(this.name)}`
		this.inputText.value = this.fieldset.node.value.getOption(this.name)
	}

	protected override detached(): void {
		super.detached()

		this.displayName.textContent = ""
		this.inputText.value = ""
	}
}

OptionFieldElement.register()