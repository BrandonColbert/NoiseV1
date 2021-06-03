interface View {
	/** Root element which this view is bound to */
	element: HTMLElement

	/** Destroy view functionality relating to the element */
	destroy(): void
}