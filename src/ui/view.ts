/**
 * Represents non-destructive functionality bound to an element
 */
export interface View {
	/** Root element which this view is bound to */
	element: Element

	/** Child views */
	views?: View.Viewset

	/** Child elements */
	elements?: View.Children

	/**
	 * Create visuals
	 */
	construct?(): void

	/**
	 * Destroy visuals
	 */
	deconstruct?(): void
}

export namespace View {
	export class Children {
		protected readonly view: View

		public constructor(view: View) {
			this.view = view
		}

		protected querySelector<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K]
		protected querySelector<K extends keyof SVGElementTagNameMap>(selectors: K): SVGElementTagNameMap[K]
		protected querySelector<E extends Element = Element>(selectors: string): E
		protected querySelector(selectors: string): Element {
			return this.view.element.querySelector(selectors)
		}
	}

	/**
	 * Manages a view's subviews
	 */
	export class Viewset extends Children {
		private views: Set<View> = new Set()

		public constructAll(): void {
			for(let view of this.views)
				view.construct?.()
		}

		public deconstructAll(): void {
			for(let view of this.views)
				view.deconstruct?.()
		}

		/**
		 * Add a subview
		 * @param view Subview
		 */
		protected add<T extends keyof this, U extends View & this[T]>(property: T, view: U): void {
			Object.assign(this, {[property]: view})
			this.views.add(view)
		}

		/**
		 * Remove a sub view
		 * @param view Subview
		 */
		protected remove<T extends keyof this, U extends View & this[T]>(property: T): void {
			let desc = Object.getOwnPropertyDescriptor(this, property)
			let value: U = desc.value ?? desc.get?.()
			this.views.delete(value)

			Object.assign(this, {[property]: undefined})
		}
	}
}

export default View