import Helper from "../core/helper.js"
import Courier from "../core/courier.js"
import Player from "../core/player.js"
import HelperView from "../ui/views/helperView.js"
import {remote} from "electron"

let view = new HelperView(document.querySelector("#graph"))
view.construct()

getHelper().then(helper => view.helper = helper)

async function getHelper(): Promise<Helper> {
	let hash = location.hash.slice(1)
	let [type, id] = hash.split(":")

	switch(type) {
		case "courier":
			return await Courier.load(id)
		case "player":
			return await Player.load(id)
		default:
			throw new Error("Invalid helper type")
	}
}

;(document.querySelector("#content > #back") as HTMLElement).onclick = async () => remote.getCurrentWindow().webContents.goBack()