/**
 * Text related utilities
 */
export default class TextUtils {
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

		function complete() {
			element.contentEditable = "false"
			element.scrollLeft = 0
		}

		return new Promise<string>(resolve => {
			let keyListener: (e: KeyboardEvent) => void = null
			let blurListener: (e: FocusEvent) => void = null

			keyListener = e => {
				switch(e.code) {
					case "Enter": //Enter
						element.removeEventListener("blur", blurListener)
						element.removeEventListener("keydown", keyListener)
						element.blur()

						complete()

						if(element.textContent.length == 0)
							resolve(null)

						resolve(element.textContent)
						break
					case "Escape": //Exit
						element.blur()
						break
				}
			}

			blurListener = () => {
				element.removeEventListener("keydown", keyListener)
				element.textContent = originalText

				complete()
				resolve(null)
			}

			element.addEventListener("keydown", keyListener)
			element.addEventListener("blur", blurListener, {once: true})

			element.contentEditable = "true"
			element.focus()
		})
	}
}