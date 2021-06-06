import {remote} from "electron"
import Courier from "./core/courier.js"
import Player from "./core/player.js"
import Dropdown from "./ui/dropdown.js"
import TextUtils from "./utils/textUtils.js"

let courierItems = document.querySelector("#couriers .items")
let playerItems = document.querySelector("#players .items")

function addItem(items: Element, name: string): HTMLDivElement {
	let item = document.createElement("div")
	item.classList.add("item")
	item.textContent = name

	items.insertBefore(item, items.lastElementChild)

	return item
}

function addCourier(courier: Courier): HTMLDivElement {
	let item = addItem(courierItems, courier.name)

	item.onclick = async _ => await remote.getCurrentWindow().loadFile(
		"app/descriptor.html",
		{hash: `courier:${courier.id}`
	})

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

				courier.name = newName
				courier.save()
			}},
			{text: "Duplicate", callback: async () => {
				let newCourier = await courier.duplicate()
				addCourier(newCourier)
			}},
			{text: "Delete", callback: async () => {
				item.remove()
				
				await courier.delete()
			}}
		], {position: [`${e.clientX}px`, `${e.clientY}px`]})
	}

	return item
}

function addPlayer(player: Player): HTMLDivElement {
	let item = addItem(playerItems, player.name)

	item.onclick = async _ => await remote.getCurrentWindow().loadFile(
		"app/descriptor.html",
		{hash: `player:${player.id}`
	})

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

				player.name = newName
				player.save()
			}},
			{text: "Duplicate", callback: async () => {
				let newPlayer = await player.duplicate()
				addPlayer(newPlayer)
			}},
			{text: "Delete", callback: async () => {
				item.remove()
				
				await player.delete()
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
	addCourier(courier)
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
	addPlayer(player)
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
		addCourier(courier)

	for(let player of players)
		addPlayer(player)
})()