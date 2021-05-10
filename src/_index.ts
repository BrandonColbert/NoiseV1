import Courier from "./core/courier/courier.js"
import Player from "./core/player/player.js"
import Playlist from "./core/playlist/playlist.js"
import PlaylistItem from "./core/playlist/item.js"
import PlayerView from "./ui/player-view.js"
import PlaylistView from "./ui/playlist-view.js"
import Dropdown from "./ui/dropdown.js"
import Format from "./utils/format.js"

// const playpause = document.querySelector("#playpause") as HTMLButtonElement
// let playlist: PlaylistView = null
// let player: PlayerView = null
// let selectedCourier: string = null
// let updater: NodeJS.Timeout = null
// let toolbarTitle = document.querySelector("#title")
// let toolbarSite = document.querySelector("#site") as HTMLElement

// async function updateLoop(): Promise<void> {
// 	playpause.dataset.playing = player.audible.toString()
// 	if(player.audible)
// 		return

// 	let [elapsed, duration] = await player.status()
// 	if(elapsed && elapsed == duration) {
// 		clearInterval(updater)
// 		updater = null

// 		await player.goto("about:blank")
// 		if(playlist.index != playlist.count - 1)
// 			nextItem()
// 		else {
// 			playlist.reset()
// 			toolbarTitle.textContent = "Untitled"
// 			toolbarSite.textContent = "Unknown"
// 		}
// 	}
// }

// async function play(item: PlaylistItem): Promise<void> {
// 	if(updater) {
// 		clearInterval(updater)
// 		updater = null
// 	}

// 	let courier = await Courier.from(item.courier ?? selectedCourier)
// 	let candidate = null

// 	for(let c of await courier.find(item.query)) {
// 		let p = await Player.for(c.url)

// 		if(p) {
// 			candidate = c
// 			player = new PlayerView(p, document.querySelector("#player"))
// 			break
// 		}
// 	}

// 	if(!candidate) {
// 		console.error(`Unable to play '${item.query}'`)
// 		return
// 	}

// 	let {url, title} = candidate

	
// 	toolbarTitle.textContent = title
// 	toolbarSite.textContent = player.name

// 	await player.goto(url)

// 	if(!player.autoplay)
// 		await player.togglePlay()

// 	if(updater)
// 		clearInterval(updater)

// 	updater = setInterval(updateLoop, 100)
// }

// function nextItem(forward: boolean = true): void {
// 	let oldIndex = playlist.index
// 	let item = forward ? playlist.progress() : playlist.regress()
// 	playlist.scrollIntoView(playlist.index)

// 	if(oldIndex == playlist.index)
// 		return

// 	play(item)
// }

// async function selectPlaylist(id: string): Promise<void> {
// 	if(updater) {
// 		clearInterval(updater)
// 		updater = null
// 	}

// 	player = null
// 	playpause.dataset.playing = "false"

// 	playlist = new PlaylistView(
// 		id,
// 		document.querySelector("#dropdown > div"),
// 		document.querySelector("#items")
// 	)

// 	playlist.on("click", event => {
// 		if(!playlist.started || event.index != playlist.index)
// 			play(playlist.skipTo(event.index))
// 	})

// 	let input = document.querySelector("#enter-item > input") as HTMLInputElement
// 	let searchValue = Format.simplify(input.value)

// 	if(!searchValue)
// 		return

// 	playlist.exhibit(item => Format.simplify(item.query).includes(searchValue))
// }

// async function selectCourier(identifier: string): Promise<void> {
// 	let courier = await Courier.from(identifier)
// 	playlist.selectedCourier = selectedCourier = courier.id
// 	document.querySelector("#courier > :nth-child(1)").textContent = courier.name
// }

// document.querySelector("#previous-item").addEventListener("click", () => nextItem(false))
// document.querySelector("#next-item").addEventListener("click", () => nextItem())
// playpause.addEventListener("click", async () => await player.togglePlay())

// document.querySelector("#dropdown > div").addEventListener("contextmenu", e => Dropdown.show([
// 	{text: "Rename", callback: () => {
// 		let listener = async (e: KeyboardEvent) => {
// 			let target = e.target as HTMLElement

// 			switch(e.keyCode) {
// 				case 13: //Enter
// 					target.blur()

// 					if(target.textContent.length == 0)
// 						return

// 					await playlist.setName(target.textContent)
// 					break
// 				case 27: //Exit
// 					target.blur()
// 					break
// 			}
// 		}

// 		e.target.addEventListener("keydown", listener)
// 		e.target.addEventListener("blur", (e: FocusEvent) => {
// 			let target = e.target as HTMLElement
// 			target.contentEditable = "false"
// 			target.textContent = playlist.name
// 			target.removeEventListener("keydown", listener)
// 		}, {once: true})

// 		let target = e.target as HTMLElement
// 		target.contentEditable = "true"
// 		target.focus()
// 	}},
// 	{text: "Export", callback: async () => await playlist.export()},
// 	{text: "Delete", callback: async () => {
// 		playlist.delete()

// 		let ids = await Playlist.getAllIds()
// 		selectPlaylist(ids.length > 0 ? ids[0] : null)
// 	}}
// ], {target: e.target as HTMLElement}))

document.querySelector("#options").addEventListener("click", e => Dropdown.show([
	{text: "Edit settings"},
	{text: "Configure couriers"},
	{text: "Configure players"},
	{text: "Export config"}
], {target: e.target as Element}))

// document.querySelector("#dropdown > button").addEventListener("click", async event => {
// 	let ids = await Playlist.getAllIds()

// 	let dropdown = Dropdown.show(
// 		ids
// 			.map(e => new Playlist(e))
// 			.map(e => ({
// 				text: e.name,
// 				callback: async () => await selectPlaylist(e.id)
// 			}))
// 			.concat({
// 				text: "+ New Playlist",
// 				callback: async () => {
// 					let playlist = new Playlist()
// 					await playlist.setName("New Playlist")
// 					await selectPlaylist(playlist.id)
// 				}
// 			}),
// 		{height: "25%", target: event.target as HTMLElement}
// 	)

// 	if(!playlist)
// 		return

// 	dropdown.element.children[ids.indexOf(playlist.id)].scrollIntoView({block: "center"})
// })


// if(Noise.playlists.length > 0)
// 	selectPlaylist(Noise.playlists[0])

// if(Noise.couriers.length > 0)
// 	selectCourier(Noise.settings.defaultCourier ?? Noise.couriers[0])