/**
 * Dropdown menu
 */
export class Dropdown {
	/** Element representing this dropdown */
	public readonly element: HTMLElement

	private constructor() {
		this.element = document.createElement("div")
		this.element.tabIndex = -1
		this.element.addEventListener("blur", this.#onBlur)
		window.addEventListener("keydown", this.#onKey)
	}

	/**
	 * Close this menu
	 */
	public close(): void {
		window.removeEventListener("keydown", this.#onKey)
		this.element.removeEventListener("blur", this.#onBlur)
		this.element.remove()
	}

	//Allow the dropdown to be closed by pressing escape
	#onKey = (event: KeyboardEvent): void => {
		switch(event.code) {
			case "Escape":
				this.close()
				break
		}
	}

	//Close the dropdown when it or its children are unfocused
	#onBlur = (event: FocusEvent): void => {
		if(event.relatedTarget == this.element)
			return

		if(event.relatedTarget instanceof Node)
			if((event.relatedTarget as Node)?.parentNode == this.element)
				return

		this.close()
	}

	/**
	 * Displays a new dropdown menu
	 * @param items Menu items
	 * @param options Menu configuration options
	 */
	public static show(items: Dropdown.Item[], options: Dropdown.Options = {}): Dropdown {
		let dropdown = new Dropdown()
		let {element} = dropdown

		//Display
		document.body.append(element)

		//Add items
		for(let item of items) {
			let button = document.createElement("button")
			button.textContent = item.text
			button.addEventListener("blur", dropdown.#onBlur)
			button.addEventListener("click", event => {
				button.removeEventListener("blur", dropdown.#onBlur)

				item.callback?.(event)
				dropdown.close()
			})

			element.append(button)
		}

		//Style
		let {style} = element

		element.classList.add("dropdown")

		if(options.hasOwnProperty("height")) {
			style.overflowY = "auto"
			style.maxHeight = options.height.toString()
		}

		if(options.hasOwnProperty("position")) {
			let [x, y] = options.position

			style.left = x.toString()
			style.top = y.toString()
		} else if(options.hasOwnProperty("target")) {
			let [width, height] = [element.clientWidth, element.clientHeight / items.length * (items.length + 1)]
			let rect = options.target.getBoundingClientRect()
			let [left, top] = [rect.x, rect.bottom]
			let [right, bottom] = [left + width, top + height]
			let [windowWidth, windowHeight] = [window.innerWidth, window.innerHeight]

			style.left = `${(right > windowWidth ? left - width : left) + window.scrollX}px`
			style.top = `${(bottom > windowHeight ? top - height : top) + window.scrollY}px`
		} else {
			style.left = "0px"
			style.top = "0px"
		}

		//Prime for usage
		element.focus()

		return dropdown
	}
}

export default Dropdown

export namespace Dropdown {
	/**
	 * Dropdown menu item
	 */
	export interface Item {
		/** Text displayed in this item's section */
		text: string
	
		/** Called when this item is clicked */
		callback?: (event: MouseEvent) => void
	}
	
	/**
	 * Alters a dropdowns appearance
	 */
	export interface Options {
		/** Max menu height in pixels before scrolling is enabled */
		height?: number | string
	
		/** Position of the menu on the screen in pixels */
		position?: [number | string, number | string]
	
		/**
		 * Element to display the menu under
		 * 
		 * Has no effect if position is specified
		 */
		target?: Element
	}
}