import {contextBridge, ipcRenderer} from "electron"
import Volume from "./utils/volume.js"

contextBridge.exposeInMainWorld("noise", {
	send: (msg: string) => ipcRenderer.sendToHost("playerMessage", msg),
	volume: Volume
})