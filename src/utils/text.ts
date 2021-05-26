export default class Text {
	/**
	 * Simplifies a string to be searched easier
	 * @param value String to be simplified
	 * @returns The value as a simplified string
	 */
	public static simplify(value: string): string {
		return value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
	}

	/**
	 * Rename an object through an element's text.
	 * 
	 * This assumes the element's text is the original value and that the text field may be modified.
	 * @param value Element whose text is to be altered
	 * @returns The new value or null if renaming failed
	 */
	public static rename(element: HTMLElement): Promise<string> {
		let originalText = element.textContent

		return new Promise<string>(resolve => {
			let keyListener: (e: KeyboardEvent) => void = null
			let blurListener: (e: FocusEvent) => void = null

			keyListener = e => {
				switch(e.code) {
					case "Enter": //Enter
						element.removeEventListener("blur", blurListener)
						element.blur()
						resolve(element.textContent.length > 0 ? element.textContent : null)
						break
					case "Escape": //Exit
						element.blur()
						break
				}
			}

			blurListener = () => {
				element.removeEventListener("keydown", keyListener)
				element.contentEditable = "false"
				element.textContent = originalText
				resolve(null)
			}

			element.addEventListener("keydown", keyListener)
			element.addEventListener("blur", blurListener, {once: true})

			element.contentEditable = "true"
			element.focus()
		})
	}
}