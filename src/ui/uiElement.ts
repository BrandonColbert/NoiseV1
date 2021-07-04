type Constructor<T> = new(...args: any[]) => T
type CustomElementName = `${string}-${string}`

export default abstract class UIElement extends HTMLElement {
	private mutationObserver: MutationObserver

	public constructor() {
		super()

		this.mutationObserver = new MutationObserver((muts: MutationRecord[], _: MutationObserver) => {
			for(let mutation of muts) {
				switch(mutation.type) {
					case "childList":
						mutation.addedNodes.forEach(n => this.onChildAttached(n))
						mutation.removedNodes.forEach(n => this.onChildDetached(n))
						break
				}
			}
		})
	}

	/**
	 * Called when connected an element
	 */
	protected attached(): void {}

	/**
	 * Called when disconnected from an element
	 */
	protected detached(): void {}

	/**
	 * Called when a child node is connected
	 * @param node Node that was connected
	 */
	protected onChildAttached(node: Node): void {}

	/**
	 * Called when a child node is disconnected
	 * @param node Node that was disconnected
	 */
	protected onChildDetached(node: Node): void {}

	private connectedCallback(): void {
		this.mutationObserver.observe(this, {childList: true})

		if(!this.isConnected)
			return

		this.attached()
	}

	private disconnectedCallback(): void {
		this.mutationObserver.disconnect()
		this.detached()
	}

	/**
	 * Register a new element under a specific name
	 * @param ctor Element constructor
	 * @param name Custom tag name within HTML
	 */
	public static register<T extends UIElement>(ctor: Constructor<T>, name: CustomElementName): void

	/**
	 * Register a new element
	 * 
	 * The element's tag name will be based on the name of its class
	 * @param ctor Element constructor
	 */
	public static register<T extends UIElement>(ctor: Constructor<T>): void

	/**
	 * Register this UIElement derivative under a specific name
	 * @param name Custom tag name within HTML
	 */
	public static register<T extends UIElement>(this: Constructor<T>, name: CustomElementName): void

	/**
	 * Register this UIElement derivative
	 * 
	 * This element's tag name will be based on the name of its class
	 */
	public static register<T extends UIElement>(this: Constructor<T>): void

	public static register<T extends UIElement>(par1?: any, par2?: any): void {
		let name: string
		let ctor: Constructor<T>

		if(par1) {
			if(par2) { //Name and constructor specified
				name = par1
				ctor = par2
			} else { //Name or constructor specified
				switch(typeof par1) {
					case "string":
						name = par1
						break
					case "function":
						ctor = par2
						break
				}
			}
		} else if(par2) //Name specified, constructor implicit
			name = par2

		if(!ctor) //Imply constructor from current class
			ctor = this as any as Constructor<T>

		if(!name) { //Create tag name based on class name
			let className = ctor.name
				.replace(/Element$/, _ => "")
				.replace(/^[A-Z]/, s => s.toLowerCase())
				.replace(/[A-Z]/, s => `-${s.toLowerCase()}`)

			name = `ui-${className}`
		}

		//Define custom element
		customElements.define(name, ctor)
	}

	/**
	 * Assert that the node is of the given type.
	 * 
	 * If the assertion is false, an error will be thrown.
	 * @param node Node to check
	 * @param ctor Expected base type
	 */
	protected static restrict<T extends Node>(node: Node, ctor: Constructor<T>): void {
		if(node instanceof ctor)
			return

		if(!node)
			throw new Error(`Expected node, none provided`)

		throw new Error(`Expected type ${ctor.name}, but got type ${node.constructor.name} with ${node}`)
	}
}