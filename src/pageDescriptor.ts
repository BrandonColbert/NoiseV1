import Courier from "./core/courier.js"
import Helper from "./core/helper.js"
import Graph from "./core/nodes/graph.js"
import Player from "./core/player.js"

let graphElement = document.querySelector<HTMLDivElement>("#graph")
graphElement.onmouseleave = () => graphElement.onmousemove = null
graphElement.onmouseup = () => graphElement.onmousemove = null
graphElement.onmousedown = e => {
	let [panX, panY] = [
		parseInt(getComputedStyle(graphElement).getPropertyValue("--pan-x").slice(0, -2)),
		parseInt(getComputedStyle(graphElement).getPropertyValue("--pan-y").slice(0, -2))
	]

	graphElement.onmousemove = e2 => {
		let [offsetX, offsetY] = [
			e2.clientX - e.clientX,
			e2.clientY - e.clientY
		]

		graphElement.style.setProperty("--pan-x", `${panX + offsetX}px`)
		graphElement.style.setProperty("--pan-y", `${panY + offsetY}px`)
	}
}

function createNodeElement(node: Graph.Node): HTMLElement {
	let element = document.createElement("div")
	element.classList.add("node")

	element.onmouseleave = () => element.onmousemove = null
	element.onmouseup = () => element.onmousemove = null
	element.onmousedown = e => {
		e.stopPropagation()

		let [panX, panY] = [
			parseInt(getComputedStyle(graphElement).getPropertyValue("--pan-x").slice(0, -2)),
			parseInt(getComputedStyle(graphElement).getPropertyValue("--pan-y").slice(0, -2))
		]

		let [offsetX, offsetY] = [
			e.clientX - element.offsetLeft,
			e.clientY - element.offsetTop
		]

		element.onmousemove = e2 => {
			let [mouseX, mouseY] = [
				e2.clientX - graphElement.offsetLeft,
				e2.clientY - graphElement.offsetTop
			]

			let [x, y] = [
				mouseX - offsetX - panX,
				mouseY - offsetY - panY
			]

			element.style.setProperty("--x", `${x}px`)
			element.style.setProperty("--y", `${y}px`)
		}
	}

	return element
}

;(async function() {
	let hash = location.hash.slice(1)
	let [type, id] = hash.split(":")

	if(!id)
		return

	let helper: Helper = null

	switch(type) {
		case "courier":
			helper = await Courier.load(id)
			break
		case "player":
			helper = await Player.load(id)
			break
	}

	if(!helper)
		return

	for(let node of helper.graph) {
		// graphElement.append(createNodeElement(node))
		break
	}
})()