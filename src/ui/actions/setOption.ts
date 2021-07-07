import OptionFieldElement from "../elements/node/optionFieldElement.js"
import NodeAction from "./nodeAction.js"

export class SetOption extends NodeAction {
	private fieldName: string
	private oldValue: string
	private newValue: string

	public constructor(field: OptionFieldElement, value: string) {
		super(field.fieldset.node)
		this.fieldName = field.name
		this.oldValue = field.fieldset.node.value.getOption(field.name)
		this.newValue = value
	}

	public execute(): void {
		this.apply(this.newValue)
	}

	public reverse(): void {
		this.apply(this.oldValue)
	}

	private apply(value: string): void {
		this.node.value.setOption(this.fieldName, value)
		this.node.options.getField(this.fieldName).inputText.value = value
	}
}