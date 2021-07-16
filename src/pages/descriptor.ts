import Helper from "../core/helper.js"
import Courier from "../core/courier.js"
import Player from "../core/player.js"
import HelperView from "../ui/views/helperView.js"
import {remote} from "electron"
import CourierNode from "../core/nodes/courierNode.js"

let view = new HelperView(document.querySelector("#graph"))
view.construct()

getHelper().then(helper => {
	view.helper = helper

	let prefix: string

	switch(true) {
		case helper instanceof Player:
			prefix = "Player"
			break
		case helper instanceof Courier:
			prefix = "Courier"

			;(globalThis as any)["testCourier"] = async (query: string) => {
				for(let node of view.helper.graph)
					if(node instanceof CourierNode)
						node.setInput("query", query)

				await view.helper.graph.walk()

				for(let node of view.elements.graph)
					console.log(node, [...node.value.outputFields].map(f => {
						let value = node.value.getOutput(f)

						switch(true) {
							case value instanceof Element: {
								function expand(element: Element): any {
									switch(element.children.length) {
										case 0:
											return element
										default:
											return [element, [...element.children].map(e => expand(e))]
									}
								}

								return expand(value)
							}
							default:
								return value
						}
					}))
			}
			break
	}

	document.querySelector("#description #name").textContent = `${prefix} | ${helper.name}`
})

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