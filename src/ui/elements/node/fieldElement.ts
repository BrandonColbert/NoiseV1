import UIElement from "../../../ui/uiElement.js"
import FieldsetElement from "./fieldsetElement.js"

export default abstract class FieldElement extends UIElement {
	public readonly name: string

	public constructor(name: string) {
		super()
		this.name = name
		this.id = name
		this.classList.add("field")
	}

	public get fieldset(): FieldsetElement<this> {
		return this.parentNode as FieldsetElement<this>
	}

	protected override attached(): void {
		UIElement.restrict(this.parentNode, FieldsetElement)
	}
}