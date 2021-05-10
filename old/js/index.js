import "./classes/display/tools.js"
import Dropdown from "./classes/display/dropdown.js"
import Noise from "./classes/noise.js"
import PlayerView from "./classes/views/player-view.js"
import PlaylistView from "./classes/views/playlist-view.js"
import Titlebar from "./classes/display/titlebar.js"

Titlebar.create()
Noise.reload()

/** @type {HTMLElement} */
const playpause = document.querySelector("#playpause")

/** @type {PlaylistView} */
let playlist = null

/** @type {PlayerView} */
let player = null

/** @type {string} */
let selectedCourier = null

/** @type {NodeJS.Timeout} */
let updater = null

async function updateLoop() {
	playpause.dataset.playing = player.audible
	if(player.audible)
		return

	let [elapsed, duration] = await player.status()
	if(elapsed && elapsed == duration) {
		clearInterval(updater)
		updater = null

		await player.goto("about:blank")
		if(playlist.index != playlist.count - 1)
			nextItem()
		else {
			playlist.reset()
			toolbarTitle.textContent = "Untitled"
			toolbarSite.textContent = "Unknown"
			toolbarSite.onclick = () => {}
		}
	}
}

/**
 * @param {import("./classes/playlist").Item} item 
 */
async function play(item) {
	if(updater) {
		clearInterval(updater)
		updater = null
	}

	let courier = Noise.loadCourier(item.courier ?? selectedCourier)
	let candidate = null

	for(let c of await courier.find(item.query)) {
		let p = Noise.loadPlayer(c.url)

		if(p) {
			candidate = c
			player = await new PlayerView(p, document.querySelector("#player"))
			break
		}
	}

	if(!candidate) {
		console.error(`Unable to play '${item.query}'`)
		return
	}

	let {url, title} = candidate

	let toolbarTitle = document.querySelector("#title")
	toolbarTitle.textContent = title

	let toolbarSite = document.querySelector("#site")
	toolbarSite.textContent = player.name
	toolbarSite.onclick = e => {}

	await player.goto(url)

	if(!player.autoplay)
		await player.togglePlay()

	if(updater)
		clearInterval(updater)

	updater = setInterval(updateLoop, 100)
}

function nextItem(forward = true) {
	let oldIndex = playlist.index
	let item = forward ? playlist.progress() : playlist.regress()
	playlist.ensureVisibility(playlist.index)

	if(oldIndex != playlist.index)
		play(item)
}

function selectPlaylist(id) {
	if(updater) {
		clearInterval(updater)
		updater = null
	}

	player = null
	playpause.dataset.playing = false

	playlist = new PlaylistView(
		Noise.loadPlaylist(id),
		document.querySelector("#dropdown > div"),
		document.querySelector("#items")
	)

	playlist.onClick = i => {
		if(!playlist.started || i != playlist.index)
			play(playlist.skipTo(i))
	}

	let searchValue = simplifyText(document.querySelector("#enter-item > input").value)

	if(searchValue)
		playlist.selectiveShow(item => simplifyText(item.query).includes(searchValue))
}

function selectCourier(identifier) {
	playlist.selectedCourier = selectedCourier = identifier
	document.querySelector("#courier > :nth-child(1)").textContent = Noise.loadCourier(identifier).name
}

let simplifyText = t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

document.querySelector("#previous-item").addEventListener("click", () => nextItem(false))
document.querySelector("#next-item").addEventListener("click", () => nextItem())
playpause.addEventListener("click", async () => await player.togglePlay())

document.querySelector("#dropdown > div").addEventListener("contextmenu", e => Dropdown.create([
	{text: "Rename", callback: () => {
		let listener = e => {
			switch(e.keyCode) {
				case 13: //Enter
					if(e.target.textContent.length > 0)
						playlist.name = e.target.textContent
				case 27: //Exit
					e.target.blur()
					break
			}
		}

		e.target.addEventListener("keydown", listener)
		e.target.addEventListener("blur", () => {
			e.target.contentEditable = false
			e.target.textContent = playlist.name
			e.target.removeEventListener("keydown", listener)
		}, {once: true})

		e.target.contentEditable = true
		e.target.focus()
	}},
	{text: "Export", callback: () => Noise.exportPlaylist(playlist.id)},
	{text: "Delete", callback: () => {
		Noise.deletePlaylist(playlist.id)
		selectPlaylist(Noise.playlists.length > 0 ? Noise.playlists[0] : null)
	}}
], {target: e.target}))

document.querySelector("#options").addEventListener("click", e => Dropdown.create([
	{text: "Edit settings"},
	{text: "Configure couriers"},
	{text: "Configure players"},
	{text: "Export config"}
], {target: e.target}))

document.querySelector("#dropdown > button").addEventListener("click", event => {
	let element = Dropdown.create(
		Noise.playlists
			.map(e => ({
				text: Noise.loadPlaylist(e).name,
				callback: () => selectPlaylist(e)
			}))
			.concat({
				text: "+ New Playlist",
				callback: () => selectPlaylist(Noise.createPlaylist("New Playlist").id)
			}),
		{height: "25%", target: event.target}
	)

	if(playlist)
		element.children[Noise.playlists.indexOf(playlist.id)].scrollIntoView({block: "center"})
})

document.querySelector("#enter-item > input").addEventListener("keydown", e => {
	switch(e.keyCode) {
		case 13: //enter
			if(e.target.value.length == 0)
				return

			playlist.selectiveShow(() => true)
			playlist.add(e.target.value, selectedCourier)
			e.target.value = ""
			break
	}
})

document.querySelector("#enter-item > input").addEventListener("input", e => {
	let value = simplifyText(e.target.value)
	playlist.selectiveShow(item => simplifyText(item.query).includes(value))
})

document.querySelector("#add-item").addEventListener("click", () => {
	let input = document.querySelector("#enter-item > input")

	if(input.value.length == 0)
		return

	playlist.selectiveShow(() => true)
	playlist.add(input.value, selectedCourier)
	input.value = ""
})

document.querySelector("#courier").addEventListener(
	"click",
	event => Dropdown.create(
		Noise.couriers.map(e => ({
			text: Noise.loadCourier(e).name,
			callback: () => selectCourier(e)
		})),
		{target: event.target, height: "25%"}
	)
)

//Allow resizing
let resizing = false
const main = document.querySelector("#main")

document.body.addEventListener("mousedown", e => {
	let thickness = 10
	let [x, y] = [e.clientX, e.clientY]

	let pr = document.querySelector("#playlist").getBoundingClientRect()
	if(pr.top <= y && y <= pr.bottom && Math.abs(x - pr.left) <= thickness) {
		resizing = true
		document.body.style.cursor = "move"
		document.body.style.pointerEvents = "none"
	}
})

document.addEventListener("mouseup", e => {
	resizing = false
	document.body.style.cursor = null
	document.body.style.pointerEvents = null
})

document.addEventListener("mousemove", e => {
	if(resizing) {
		document.getSelection().empty()

		let x = e.clientX
		let w = Math.max(0, Math.min((window.innerWidth - x) / window.innerWidth * 2, 2))
		main.style.gridTemplateColumns = w > 1 ? `${2 - w}fr 1fr` : `1fr ${w}fr`
	}
})

if(Noise.playlists.length > 0)
	selectPlaylist(Noise.playlists[0])

if(Noise.couriers.length > 0)
	selectCourier(Noise.settings.defaultCourier ?? Noise.couriers[0])