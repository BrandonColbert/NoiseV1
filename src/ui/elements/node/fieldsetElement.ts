import UIElement from "../../../ui/uiElement.js"
import NodeElement from "../nodeElement.js"
import FieldElement from "./fieldElement.js"

type FieldCtor<T extends FieldElement> = new(name: string) => T
type FieldsetType = "inputs" | "outputs" | "options"

export default class FieldsetElement<T extends FieldElement> extends UIElement {
	private readonly fieldCtor: FieldCtor<T>

	public constructor(type: FieldsetType, fieldCtor: FieldCtor<T>) {
		super()
		this.id = type
		this.fieldCtor = fieldCtor
	}

	public get node(): NodeElement {
		return this.parentNode as NodeElement
	}

	public get size(): number {
		return this.children.length
	}

	public getField(name: string): T {
		return this.querySelector<T>(`:scope > [id='${name}']`)
	}

	public *[Symbol.iterator](): IterableIterator<T> {
		for(let child of this.children)
			yield child as T
	}
	
	protected override attached(): void {
		UIElement.restrict(this.parentNode, NodeElement)

		let fieldNames: string[]

		switch(this.id) {
			case "inputs":
				fieldNames = [...this.node.value.inputFields]
				break
			case "outputs":
				fieldNames = [...this.node.value.outputFields]
				break
			case "options":
				fieldNames = [...this.node.value.optionFields]
				break
			default:
				return
		}

		for(let name of fieldNames)
			this.append(new this.fieldCtor(name))

		this.style.display = this.size > 0 ? "" : "none"
	}

	protected override detached(): void {
		while(this.children.length > 0)
			this.lastChild.remove()
	}

	protected override onChildAttached(node: Node) {
		UIElement.restrict(node, this.fieldCtor)
	}
}

FieldsetElement.register()