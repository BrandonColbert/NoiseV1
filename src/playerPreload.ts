import {contextBridge, ipcRenderer, webFrame} from "electron"

contextBridge.exposeInMainWorld("noise", {
	send: (msg: string) => ipcRenderer.sendToHost("playerMessage", msg)
})

// webFrame.executeJavaScript(`
// 	window.Audio = class {
// 		constructor() {
// 			let element = document.createElement("audio")
// 			document.body.append(element)

// 			return element
// 		}
// 	}
// `)