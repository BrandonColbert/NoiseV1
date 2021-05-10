const {remote} = require("electron")

export default class Tools {
	static enable() {
		document.addEventListener("keydown", e => {
			switch(e.keyCode) {
				case 73: //i
					if(!e.ctrlKey || !e.shiftKey)
						break
				case 123: //f12
					remote.getCurrentWindow().webContents.toggleDevTools()
					break
				case 82: //r
					if(!e.ctrlKey)
						break
				case 116: //f5
					remote.getCurrentWindow().reload()
					break
			}
		})
	}
}

Tools.enable()