const {remote} = require("electron")

/**
 * Shows a titlebar
 */
export default class Titlebar {
	/**
	 * Creates a titlebar for the current document
	 */
	static create() {
		const titlebar = document.createElement("div")
		titlebar.classList.add("titlebar")
		document.body.prepend(titlebar)

		const dragRegion = document.createElement("div")
		titlebar.append(dragRegion)
		
		const minimizeButton = document.createElement("button")
		const restoreButton = document.createElement("button")
		const closeButton = document.createElement("button")

		const buttons = document.createElement("div")
		buttons.appendChild(minimizeButton)
		buttons.appendChild(restoreButton)
		buttons.appendChild(closeButton)
		titlebar.append(buttons)

		const w = remote.getCurrentWindow()
		let minimizeListener = () => w.minimize()
		let restoreListener = () => w.isMaximized() ? w.restore() : w.maximize()
		let closeListener = () => w.close()

		minimizeButton.addEventListener("click", minimizeListener)
		restoreButton.addEventListener("click", restoreListener)
		closeButton.addEventListener("click", closeListener)

		window.addEventListener("beforeunload", () => {
			minimizeButton.removeEventListener("click", minimizeListener)
			restoreButton.removeEventListener("click", restoreListener)
			closeButton.removeEventListener("click", closeListener)
		})
	}
}