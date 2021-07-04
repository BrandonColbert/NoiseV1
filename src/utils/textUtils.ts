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
	 * Converts an variable-like name to a user-friendly name
	 * @param value Variable-like name
	 * @returns A user-friendly name
	 */
	public static transformToName(value: string): string {
		return value
			.replace(/^[a-z]/, s => s.toUpperCase())
			.replace(/([a-z])([A-Z])/g, (_, ...p) => `${p[0]} ${p[1]}`)
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
			let keyListener: (e: KeyboardEvent) => void
			let blurListener: (e: FocusEvent) => void

			keyListener = e => {
				switch(e.code) {
					case "Enter": //Enter
						element.removeEventListener("blur", blurListener)
						element.removeEventListener("keydown", keyListener)
						element.blur()

						complete()

						if(!element.textContent)
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