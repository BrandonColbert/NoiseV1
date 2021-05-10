import {remote} from "electron"

export default class Inspection {
	private static isEnabled: boolean = false

	/**
	 * Whether inspection is allowed
	 */
	static get enabled(): boolean {
		return this.isEnabled
	}

	static set enabled(value: boolean) {
		if(this.isEnabled) {
			if(value)
				return

			document.removeEventListener("keydown", Inspection.onKey)
		} else {
			if(!value)
				return

			document.addEventListener("keydown", Inspection.onKey)
		}
	}

	private static onKey(event: KeyboardEvent) {
		switch(event.keyCode) {
			case 73: //i
				if(!event.ctrlKey || !event.shiftKey)
					break

				remote.getCurrentWindow().webContents.toggleDevTools()
				break
			case 123: //f12
				remote.getCurrentWindow().webContents.toggleDevTools()
				break
			case 82: //r
				if(!event.ctrlKey)
					break

				remote.getCurrentWindow().reload()
				break
			case 116: //f5
				remote.getCurrentWindow().reload()
				break
		}
	}
}