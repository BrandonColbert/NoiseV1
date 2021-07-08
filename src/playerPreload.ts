import {contextBridge, ipcRenderer} from "electron"

contextBridge.exposeInMainWorld("noise", {
	send: (msg: string) => ipcRenderer.sendToHost("playerMessage", msg)
})