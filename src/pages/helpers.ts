import {remote} from "electron"
import Helper from "../core/helper.js"
import Courier from "../core/courier.js"
import Player from "../core/player.js"
import Dropdown from "../ui/dropdown.js"
import TextUtils from "../utils/textUtils.js"

let courierItems = document.querySelector("#couriers .items")
let playerItems = document.querySelector("#players .items")

function addItem(items: Element, name: string): HTMLDivElement {
	let item = document.createElement("div")
	item.classList.add("item")
	item.textContent = name

	items.insertBefore(item, items.lastElementChild)

	return item
}

function addHelper(helper: Helper): HTMLDivElement {
	let items: Element
	let hash: string

	switch(true) {
		case helper instanceof Courier:
			items = courierItems
			hash = `courier:${(helper as Courier).id}`
			break
		case helper instanceof Player:
			items = playerItems
			hash = `player:${(helper as Player).id}`
			break
	}

	let item = addItem(items, helper.name)

	item.onclick = async _ => await remote.getCurrentWindow().loadFile(
		"app/descriptor.html",
		{hash: hash}
	)

	item.oncontextmenu = e => {
		e.preventDefault()

		Dropdown.show([
			{text: "Rename", callback: async () => {
				let target = e.target as HTMLElement

				let oldName = target.textContent
				let newName = await TextUtils.rename(target)

				if(!newName) {
					target.textContent = oldName
					return
				}

				helper.name = newName
				helper.save()
			}},
			{text: "Duplicate", callback: async () => {
				let newHelper = await helper.duplicate()
				addHelper(newHelper)
			}},
			{text: "Delete", callback: async () => {
				item.remove()
				
				await helper.delete()
			}}
		], {position: [`${e.clientX}px`, `${e.clientY}px`]})
	}

	return item
}

;(document.querySelector("#couriers .item.placeholder") as HTMLElement).onclick = async _ => {
	let item = addItem(courierItems, "New Courier")
	let name = await TextUtils.rename(item)

	if(!name) {
		item.remove()
		return
	}

	let courier = await Courier.create(name)
	await courier.save()

	item.remove()
	addHelper(courier)
}

;(document.querySelector("#players .item.placeholder") as HTMLElement).onclick = async _ => {
	let item = addItem(playerItems, "New Player")
	let name = await TextUtils.rename(item)

	if(!name) {
		item.remove()
		return
	}

	let player = await Player.create(name)
	await player.save()

	item.remove()
	addHelper(player)
}

;(document.querySelector("#content > #back") as HTMLElement).onclick = async _ => {
	remote.getCurrentWindow().webContents.goBack()
}

;(async function() {
	let couriers = await Courier.all()
	let players = await Player.all()

	couriers.sort((a, b) => a.name.localeCompare(b.name))
	players.sort((a, b) => a.name.localeCompare(b.name))

	for(let courier of couriers)
		addHelper(courier)

	for(let player of players)
		addHelper(player)
})()