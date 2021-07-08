import Generate from "../../utils/generate.js"

type NodeConstructor = new(...args: ConstructorParameters<typeof Graph.Node>) => Graph.Node

export class Graph {
	private nodes: Map<string, Graph.Node>
	private nodeRegistry: {
		nameToCtor: Map<string, NodeConstructor>,
		ctorToName: Map<NodeConstructor, string>
	}

	public constructor() {
		this.nodeRegistry = {
			nameToCtor: new Map<string, NodeConstructor>(),
			ctorToName: new Map<NodeConstructor, string>()
		}

		this.nodes = new Map<string, Graph.Node>()
	}

	/**
	 * Create a new node and add it to this graph
	 * @param type Node type
	 * @returns Created node instance
	 */
	public createNode(type: string): Graph.Node {
		if(!this.nodeRegistry.nameToCtor.has(type))
			throw new Error(`Invalid node type ${type}`)

		let ctor = this.nodeRegistry.nameToCtor.get(type)
		let node = new ctor(this)
		this.addNode(node)

		return node
	}

	/**
	 * Add a node to this graph
	 * @param node Node instance
	 */
	public addNode(node: Graph.Node): void {
		if(this.nodes.has(node.id))
			throw new Error(`Node with id ${node.id} is already present in the graph`)

		this.nodes.set(node.id, node)
	}

	/**
	 * Removes a node from this graph
	 * @param id Id of the node to remove
	 */
	public removeNode(id: string): void {
		let node = this.nodes.get(id)

		if(!node)
			return

		for(let field of node.inputFields)
			node.disconnect(field)

		for(let field of node.outputFields)
			for(let consumer of node.getConsumers(field))
				consumer.node.disconnect(consumer.fieldName)

		this.nodes.delete(id)
	}

	/**
	 * @param id Id of the node instance
	 * @returns Node in this graph with the corresponding id
	 */
	public getNode(id: string): Graph.Node {
		return this.nodes.get(id)
	}

	/**
	 * @returns The data defining node interaction and behavior
	 */
	public getDataset(): Graph.Node.Dataset {
		return Object.fromEntries([...this].map(n => ([n.id, n.getData()])))
	}

	/**
	 * @param value Data for each node
	 */
	public setDataset(value: Graph.Node.Dataset): void {
		for(let [id, data] of Object.entries(value)) {
			const Ctor = this.nodeRegistry.nameToCtor.get(data.type)

			if(!Ctor)
				throw new Error(`Unable to construct node "${data.type}"`)

			this.addNode(new Ctor(this, data, id))
		}
	}

	/**
	 * Propogates all possible nodes
	 */
	public async walk(): Promise<void> {
		for(let node of this)
			if(node.bootstrapper)
				await node.propogate()
	}

	/**
	 * Register a new node type to be used in the graph
	 * @param type Identifying name for the node
	 * @param ctor Node class to associate with the name
	 */
	public registerNodeType<T extends NodeConstructor>(type: string, ctor: T): void {
		this.nodeRegistry.nameToCtor.set(type, ctor)
		this.nodeRegistry.ctorToName.set(ctor, type)
	}

	/**
	 * @param ctor Node class
	 * @returns The identifying name of the node class
	 */
	public getNodeType<T extends NodeConstructor>(ctor: T): string {
		return this.nodeRegistry.ctorToName.get(ctor)
	}

	/**
	 * @return All node types
	 */
	public getNodeTypes(): string[] {
		return [...this.nodeRegistry.nameToCtor.keys()]
	}

	/**
	 * @param type Identifying name for the node
	 * @returns Constructor for the node type
	 */
	public getNodeConstructor(typeName: string): NodeConstructor {
		return this.nodeRegistry.nameToCtor.get(typeName)
	}

	*[Symbol.iterator]() {
		for(let node of this.nodes.values())
			yield node
	}
}

export namespace Graph {
	export abstract class Node {
		/** Unique identifier of this node instance */
		public readonly id: string

		/** Graph which this node is a part of */
		public readonly graph: Graph

		private readonly data: Node.Data
		private input: Map<string, any>
		private output: Map<string, any>
		private fields: {
			input: Map<string, Node.InputDescription>,
			output: Map<string, Node.ConnectionDescription>,
			options: Map<string, Node.OptionDescription>
		}

		public constructor(graph: Graph, data?: Node.Data, id?: string) {
			this.graph = graph
			this.id = id ?? Generate.uuid()

			this.input = new Map<string, any>()
			this.output = new Map<string, any>()

			this.data = data ?? {
				position: [0, 0],
				type: graph.getNodeType(this.constructor as NodeConstructor)
			}

			this.fields = {
				input: new Map(),
				output: new Map(),
				options: new Map()
			}
		}

		/** Name of this node type according to the graph */
		public get name(): string {
			return this.graph.getNodeType(this.constructor as NodeConstructor)
		}

		/** Whether inputs are necessary to propogate */
		public get bootstrapper(): boolean {
			return this.fields.input.size == 0
		}

		/** Location of this node in the graph */
		public get position(): [number, number] {
			return this.data.position
		}

		public set position(value: [number, number]) {
			this.data.position = value
		}

		/** Available input field names */
		public get inputFields(): IterableIterator<string> {
			return this.fields.input.keys()
		}

		/** Available output field names */
		public get outputFields(): IterableIterator<string> {
			return this.fields.output.keys()
		}

		/** Available option field names */
		public get optionFields(): IterableIterator<string> {
			return this.fields.options.keys()
		}

		/** State of input satisfaction */
		public get status(): Node.Status {
			let satisfied = (fieldName: string) => this.input.has(fieldName) || this.getInputDescription(fieldName).optional == true

			let inputKeys = [...this.inputFields]

			if(inputKeys.every(v => satisfied(v)))
				return Node.Status.Complete
			else if(inputKeys.some(v => satisfied(v)))
				return Node.Status.Partial
			else
				return Node.Status.Latent
		}

		/**
		 * @returns A copy of this graph's data
		 */
		public getData(): Node.Data {
			return JSON.parse(JSON.stringify(this.data))
		}

		/**
		 * Assign output fields based on input and option fields.
		 * 
		 * Send results to connected nodes' input fields.
		 */
		public async propogate(): Promise<void> {
			//Check if all inputs are satisfied
			if(this.status != Node.Status.Complete)
				return

			//Clear existing outputs and process new results
			this.output.clear()
			await this.process()

			//Propogate connected nodes
			for(let outputName in this.data.output) {
				let value = this.getOutput(outputName)

				for(let id in this.data.output[outputName]) {
					let targetNode = this.graph.getNode(id)

					for(let inputName of this.data.output[outputName][id])
						targetNode.setInput(inputName, value)

					await targetNode.propogate()
				}
			}
		}

		/**
		 * Creates an HTMLElement representing the node's output
		 */
		//TODO
		// public abstract createResultElement(): HTMLElement

		/**
		 * Connect an output field to another node's input field
		 * @param outputName Name of this node's output field
		 * @param target Node to send output value to
		 * @param inputName Name of the field on the target node which receives the value
		 */
		public connect(outputName: string, target: Graph.Node, inputName: string): void {
			if(!Graph.Node.isValidConnection({node: this, fieldName: outputName}, {node: target, fieldName: inputName}))
				throw new Error(`Invalid connection from ${this.id}:${outputName} -> ${target.id}:${inputName}`)

			this.data.output ??= {}
			this.data.output[outputName] ??= {}
			this.data.output[outputName][target.id] ??= []
			this.data.output[outputName][target.id].push(inputName)
			
			let targetNode = this.graph.getNode(target.id) as this
			targetNode.data.input ??= {}
			targetNode.data.input[inputName] = [this.id, outputName]
		}

		/**
		 * Disconnects an input field from its attached output field
		 * @param inputName Name of this node's input field
		 */
		public disconnect(inputName: string): void {
			if(!this.data.input?.[inputName])
				return

			this.input.delete(inputName)

			let [sourceNodeId, outputName] = this.data.input[inputName]

			let sourceNode = this.graph.getNode(sourceNodeId)
			let fieldNames = sourceNode.data.output[outputName][this.id].filter(f => f != inputName)
			sourceNode.data.output[outputName][this.id] = fieldNames

			if(fieldNames.length == 0)
				delete sourceNode.data.output[outputName][this.id]
			if(Object.keys(sourceNode.data.output[outputName]).length == 0)
				delete sourceNode.data.output[outputName]
			if(Object.keys(sourceNode.data.output).length == 0)
				delete sourceNode.data.output

			delete this.data.input[inputName]

			if(Object.keys(this.data.input).length == 0)
				delete this.data.input
		}

		/**
		 * Set the value for an input field
		 * @param fieldName Input field name
		 * @param value Value to assign
		 */
		public setInput(fieldName: string, value: any): void {
			if(value != null)
				this.input.set(fieldName, value)
			else
				this.input.delete(fieldName)
		}

		/**
		 * @param fieldName Input field name
		 * @returns Value for the specified input field 
		 */
		public getInput<T = any>(fieldName: string): T {
			return this.input.get(fieldName) as T
		}

		/**
		 * @param fieldName Input field name
		 * @returns Description of the specified input field
		 */
		public getInputDescription(fieldName: string): Node.InputDescription {
			return this.fields.input.get(fieldName)
		}

		/**
		 * @param fieldName Input field name
		 * @returns The node and output field supplying the specified input field's value or null if no supplier exists
		 */
		public getSupplier(fieldName: string): Node.FieldReference {
			if(!this.data.input?.[fieldName])
				return null

			let [sourceId, sourceFieldName] = this.data.input[fieldName]

			return {
				node: this.graph.getNode(sourceId),
				fieldName: sourceFieldName
			}
		}

		/**
		 * Set the value for an output field
		 * @param fieldName Output field name
		 * @param value Value to assign
		 */
		public setOutput(fieldName: string, value: any): void {
			this.output.set(fieldName, value)
		}

		/**
		 * @param fieldName Output field name
		 * @returns Value for the specified output field 
		 */	
		public getOutput<T = any>(fieldName: string): T {
			return this.output.get(fieldName) as T
		}

		/**
		 * @param fieldName Output field name
		 * @returns Description of the specified output field
		 */
		public getOutputDescription(fieldName: string): Node.ConnectionDescription {
			return this.fields.output.get(fieldName)
		}

		/**
		 * @param fieldName Output field name
		 * @returns The nodes and their corresponding output fields consuming the specified output field's value
		 */
		public getConsumers(fieldName: string): Node.FieldReference[] {
			return Object.entries(this.data.output?.[fieldName] ?? {}).flatMap(target => {
				let [targetNodeId, targetFields] = target

				return targetFields.map(targetField => ({
					node: this.graph.getNode(targetNodeId),
					fieldName: targetField
				}))
			})
		}

		/**
		 * Set the value for an option field
		 * @param fieldName Option field name
		 * @param value String to assign
		 */
		public setOption(fieldName: string, value: string): void {
			this.data.options ??= {}
			this.data.options[fieldName] = value
		}

		/**
		 * @param name Option field name
		 * @returns String for the specified option field 
		 */	
		public getOption(fieldName: string): string {
			return this.data.options?.[fieldName] ?? this.fields.options.get(fieldName)?.defaultValue ?? ""
		}

		/**
		 * @param fieldName Option field name
		 * @returns Description of the specified option field
		 */
		public getOptionDescription(fieldName: string): Node.OptionDescription {
			return this.fields.options.get(fieldName)
		}

		public static isValidConnection(supplier: Node.FieldReference, consumer: Node.FieldReference): boolean {
			let supplierDesc = supplier.node.getOutputDescription(supplier.fieldName)
			let consumerDesc = consumer.node.getInputDescription(consumer.fieldName)

			if(!consumerDesc.type || !supplierDesc.type)
				return true

			return consumerDesc.type == supplierDesc.type
		}

		/**
		 * Register a field to be used in processing
		 * @param fieldName Field name
		 * @param desc Field description
		 */
		protected addInputField(fieldName: string, desc: Node.InputDescription = {}): void {
			this.fields.input.set(fieldName, desc)
		}

		/**
		 * Register a field to be used in processing
		 * @param fieldName Field name
		 * @param desc Field description
		 */
		protected addOutputField(fieldName: string, desc: Node.ConnectionDescription = {}): void {
			this.fields.output.set(fieldName, desc)
		}

		/**
		 * Register a field to be used in processing
		 * @param fieldName Field name
		 * @param desc Field description
		 */
		protected addOptionField(fieldName: string, desc: Node.OptionDescription = {}): void {
			this.fields.options.set(fieldName, desc)

			if(!desc.defaultValue)
				return

			this.data.options ??= {}
			this.data.options[fieldName] ??= desc.defaultValue
		}

		/**
		 * Process the value of output fields assuming all input fields are satisfied
		 */
		protected abstract process(): Promise<void>
	}

	export namespace Node {
		/** The ids of each node and their data */
		export type Dataset = {[key: string]: Data}

		/** A reference to a specific field of a node */
		export type FieldReference = {node: Node, fieldName: string}

		export enum Status {
			/** No inputs satisfied */
			Latent = "latent",
			/** Some inputs satisfied */
			Partial = "partial",
			/** All inputs satisfied */
			Complete = "complete"
		}

		export interface Data {
			/** xy coordinates */
			position: [number, number]
		
			/** Corresponding node type */
			type: string
		
			/** Options affecting output values */
			options?: {[key: string]: string}
		
			/**
			 * Defines the source of each input field.
			 * 
			 * The key is the input field's name.
			 * 
			 * The value is the supplier node's id and output field name.
			 */
			input?: {[key: string]: [string, string]}
		
			/**
			 * Defines where resulting values are sent.
			 * 
			 * The key is the output field's name.
			 * 
			 * The value maps a node id to a list of input fields for the corresponding node. Every specified input field will receive the output field's value.
			 */
			output?: {[key: string]: {[id: string]: string[]}}
		}

		export interface FieldDescription {
			/** User-friendly name */
			name?: string
		
			/** Summary describing this field's purpose */
			summary?: string
		}
		
		export interface ConnectionDescription extends FieldDescription {
			/**
			 * Type of the object being contained.
			 * 
			 * If unspecified, any value is allowed.
			 * 
			 * If this field is describing an input, its connection will be restricted to output fields with the same type.
			 */
			type?: string
		}

		export interface InputDescription extends ConnectionDescription {
			/**
			 * Whether a value is required for the connection to be satisfied
			 */
			optional?: boolean
		}
		
		export interface OptionDescription extends FieldDescription {
			defaultValue?: string
		}
	}
}

export default Graph