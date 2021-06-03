import {remote} from "electron"

/**
 * Application titlebar
 */
export default class Titlebar {
	/** Element representing this titlebar */
	public readonly element: HTMLElement

	public constructor() {
		this.element = document.createElement("div")
		this.element.classList.add("titlebar")

		//Drag region
		this.element.append(document.createElement("div"))

		//Buttons
		let minimize = document.createElement("button")
		let restore = document.createElement("button")
		let close = document.createElement("button")

		//Events
		minimize.addEventListener("click", this.minimize)
		restore.addEventListener("click", this.restore)
		close.addEventListener("click", this.close)

		window.addEventListener("beforeunload", () => {
			minimize.removeEventListener("click", this.minimize)
			restore.removeEventListener("click", this.restore)
			close.removeEventListener("click", this.close)
		})

		//Button region
		let buttons = document.createElement("div")
		buttons.appendChild(minimize)
		buttons.appendChild(restore)
		buttons.appendChild(close)
		this.element.append(buttons)
	}

	/**
	 * Show this titlebar
	 */
	public show() {
		document.body.prepend(this.element)
	}

	/**
	 * Hide this titlebar
	 */
	public hide() {
		document.body.removeChild(this.element)
	}

	/**
	 * Minimize the window
	 */
	public minimize(): void {
		remote.getCurrentWindow().minimize()
	}

	/**
	 * Restore the window's size or maximize it
	 */
	public restore() {
		let window = remote.getCurrentWindow()

		if(window.isMaximized())
			window.restore()
		else
			window.maximize()
	}

	/**
	 * Close the window
	 */
	public close() {
		remote.getCurrentWindow().close()
	}
}