import Courier from "./core/courier.js"
import Playlist from "./core/playlist.js"
import DDListElement from "./ui/ddListElement.js"
import PlaybackView from "./ui/views/playbackView.js"

DDListElement.define()

async function getRecentPlaylist(): Promise<Playlist> {
	let id = localStorage.getItem("playlist")

	if(id) {
		let playlist = await Playlist.load(id)

		if(playlist)
			return playlist
	}

	let playlists = await Playlist.all()

	if(playlists.length == 0)
		return null

	return playlists[0]
}

async function getRecentCourier(): Promise<Courier> {
	let id = localStorage.getItem("courier")

	if(id) {
		let courier = await Courier.load(id)

		if(courier)
			return courier
	}

	return null
}

const playback = new PlaybackView(document.querySelector("#playback"))

//Set playlist to last used
getRecentPlaylist().then(async playlist => {
	if(!playlist)
		return

	await playback.playlistView.setPlaylist(playlist)
})

//Set courier to last used
getRecentCourier().then(async courier => {
	if(!courier)
		return

	playback.playlistView.setCourier(courier)
})