import Graph from "../../core/nodes/graph.js"
import GraphElement from "../elements/graphElement.js"
import GraphAction from "./graphAction.js"
type FieldReference = {id: string, fieldName: string}

export class Connect extends GraphAction {
	private consumer: FieldReference
	private newSupplier: FieldReference
	private oldSupplier: FieldReference

	public constructor(graph: GraphElement, consumer: Graph.Node.FieldReference, supplier?: Graph.Node.FieldReference) {
		super(graph)
		this.consumer = {id: consumer.node.id, fieldName: consumer.fieldName}

		let old = consumer.node.getSupplier(consumer.fieldName)
		this.oldSupplier = old ? {id: old.node.id, fieldName: old.fieldName} : null
		this.newSupplier = supplier ? {id: supplier.node.id, fieldName: supplier.fieldName} : null
	}

	public execute(): void {
		this.apply(this.newSupplier)
	}

	public reverse(): void {
		this.apply(this.oldSupplier)
	}

	private apply(supplier: FieldReference): void {
		let target = this.graph.get(this.consumer.id)

		if(target.value.getSupplier(this.consumer.fieldName))
			target.value.disconnect(this.consumer.fieldName)

		if(supplier) {
			let source = this.graph.get(supplier.id)

			source.value.connect(
				supplier.fieldName,
				target.value,
				this.consumer.fieldName
			)
		} else
			target.value.disconnect(this.consumer.fieldName)

		target.visualizeConnections()
	}
}