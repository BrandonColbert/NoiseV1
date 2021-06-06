import Generate from "../../utils/generate.js"

type NodeConstructor = new(...args: any[]) => Graph.Node
type Nodes = {[key: string]: Graph.Node.Data}

export class Graph {
	private nodes: Map<string, Graph.Node>
	private nodeRegistry: {
		nameToCtor: Map<string, NodeConstructor>,
		ctorToName: Map<NodeConstructor, string>
		nameToCategory: Map<string, string>
	}

	public constructor() {
		this.nodeRegistry = {
			nameToCtor: new Map<string, NodeConstructor>(),
			ctorToName: new Map<NodeConstructor, string>(),
			nameToCategory: new Map<string, string>()
		}

		this.nodes = new Map<string, Graph.Node>()
	}

	/**
	 * Data defining node interaction and behavior.
	 * 
	 * Getting this property returns a copy of the data.
	 */
	public get nodeData(): Nodes {
		return Object.fromEntries([...this].map(n => ([n.id, n.copyData()])))
	}

	public set nodeData(value: Nodes) {
		for(let [id, data] of Object.entries(value)) {
			const Ctor = this.nodeRegistry.nameToCtor.get(data.type)
			this.addNode(new Ctor(this, data, id))
		}
	}

	/**
	 * Add a new node to the graph
	 * @param node Node instance
	 */
	public addNode(node: Graph.Node) {
		this.nodes.set(node.id, node)
	}

	/**
	 * @param id Id of the node instance
	 * @returns A node instance by id
	 */
	public getNode(id: string): Graph.Node {
		return this.nodes.get(id)
	}

	/**
	 * Removes a node from the graph
	 * @param id Id of the node to remove
	 */
	public removeNode(id: string): void {
		this.nodes.delete(id)
	}

	/**
	 * Register a new node type to be used in the graph
	 * @param typeName Identifying name for the node
	 * @param typeClass Node class to associate with the name
	 * @param category
	 */
	public registerNodeType<T extends NodeConstructor>(typeName: string, typeClass: T, category: string = ""): void {
		this.nodeRegistry.nameToCtor.set(typeName, typeClass)
		this.nodeRegistry.ctorToName.set(typeClass, typeName)
		this.nodeRegistry.nameToCategory.set(typeName, category)
	}

	/**
	 * @param typeClass Node class
	 * @returns The identifying name of the node class
	 */
	public getNodeTypeName<T extends NodeConstructor>(typeClass: T): string {
		return this.nodeRegistry.ctorToName.get(typeClass)
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

		private readonly graph: Graph
		private readonly data: Node.Data
		private input: Map<string, any>
		private output: Map<string, any>
		private fields: {
			input: Map<string, ConnectionDescription>,
			output: Map<string, ConnectionDescription>,
			options: Map<string, OptionDescription>
		}

		protected constructor(graph: Graph, data: Node.Data = null, id: string = null) {
			this.graph = graph
			this.id = id ?? Generate.uuid()

			this.input = new Map<string, any>()
			this.output = new Map<string, any>()

			this.data = data ?? {
				position: [0, 0],
				type: graph.getNodeTypeName(this.constructor as NodeConstructor)
			}

			this.fields = {
				input: new Map<string, ConnectionDescription>(),
				output: new Map<string, ConnectionDescription>(),
				options: new Map<string, OptionDescription>()
			}
		}

		/** State of input satisfaction */
		public get status(): Node.Status {
			let inputKeys = [...this.fields.input.keys()]

			if(inputKeys.every(v => this.input.has(v)))
				return Node.Status.Complete
			else if(inputKeys.some(v => this.input.has(v)))
				return Node.Status.Partial
			else
				return Node.Status.Latent
		}

		/**
		 * @returns A copy of this node's data
		 */
		public copyData(): Node.Data {
			return JSON.parse(JSON.stringify(this.data))
		}

		/**
		 * Assign output fields based on input and option fields.
		 * 
		 * Send results to connected nodes' input fields.
		 */
		public async propogate(): Promise<void> {
			//Check if all inputs are satisfied
			if(this.status == "latent")
				return

			//Clear existing outputs and process new results
			this.output.clear()
			await this.process()

			//Propogate connected nodes
			for(let outputName in this.data.output ?? {}) {
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
		 * Connect an output field to another node's input field
		 * @param outputName Name of this node's output field
		 * @param target Node to send output value to
		 * @param inputName Name of the field on the target node which receives the value
		 */
		public connect(outputName: string, target: Graph.Node, inputName: string): void {
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
			let [sourceNodeId, outputName] = this.data.input[inputName]

			let sourceNode = this.graph.getNode(sourceNodeId) as this
			let fieldNames = sourceNode.data.output[outputName][this.id]
			fieldNames.splice(fieldNames.indexOf(inputName), 1)

			if(fieldNames.length == 0)
				delete sourceNode.data.output[outputName]
			if(Object.keys(sourceNode.data.output).length == 0)
				delete sourceNode.data.output

			delete this.data.input[inputName]

			if(Object.keys(this.data.input).length == 0)
				delete this.data.input
		}

		/**
		 * Set the value for an input field
		 * @param name Input field name
		 * @param value Value to assign
		 */
		public setInput(name: string, value: any): void {
			this.input.set(name, value)
		}

		/**
		 * @param name Input field name
		 * @returns Value for the specified input field 
		 */
		public getInput<T = any>(name: string): T {
			return this.input.get(name) as T
		}

		/**
		 * Set the value for an output field
		 * @param name Output field name
		 * @param value Value to assign
		 */
		public setOutput(name: string, value: any): void {
			this.output.set(name, value)
		}

		/**
		 * @param name Output field name
		 * @returns Value for the specified output field 
		 */	
		public getOutput<T = any>(name: string): T {
			return this.output.get(name) as T
		}

		/**
		 * Set the value for an option field
		 * @param name Option field name
		 * @param value String to assign
		 */
		public setOption(name: string, value: string): void {
			this.data.options ??= {}
			this.data.options[name] = value
		}

		/**
		 * @param name Option field name
		 * @returns String for the specified option field 
		 */	
		public getOption(name: string): string {
			return (this.data.options?.[name] as string) ?? null
		}

		protected addInputField(name: string, desc: ConnectionDescription = {}): void {
			this.fields.input.set(name, desc)
		}

		protected addOutputField(name: string, desc: ConnectionDescription = {}): void {
			this.fields.output.set(name, desc)
		}

		protected addOptionField(name: string, desc: OptionDescription = {}): void {
			this.fields.options.set(name, desc)

			if(!desc.defaultValue)
				return

			this.data.options ??= {}
			this.data.options[name] ??= desc.defaultValue
		}

		protected abstract process(): Promise<void>
	}

	export namespace Node {
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
			options?: {[key: string]: string | number | boolean}
		
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
	}
}

interface FieldDescription {
	/** User-friendly name */
	name?: string

	/** Summary describing this field's purpose */
	summary?: string
}

interface ConnectionDescription extends FieldDescription {
	/**
	 * Type of the object being contained.
	 * 
	 * If unspecified, any value is allowed.
	 * 
	 * If this field is describing an input, its connection will be restricted to output fields with the same type.
	 */
	type?: string
}

interface OptionDescription extends FieldDescription {
	defaultValue?: string
}

export default Graph