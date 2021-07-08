import Courier from "../core/courier.js"
import Playlist from "../core/playlist.js"
import PlaybackView from "../ui/views/playbackView.js"

const playback = new PlaybackView(document.querySelector("#playback"))
playback.construct()

//Set playlist and courier to last used
getRecentCourier().then(async courier => playback.views.playlistView.views.entrybarView.courier = courier)
getRecentPlaylist().then(async playlist => playback.views.playlistView.playlist = playlist)
playback.views.toolbarView.volume = getRecentVolume()
playback.views.toolbarView.muted = getRecentMute()

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

function getRecentVolume(): number {
	let volume = localStorage.getItem("volume")

	if(volume)
		return parseFloat(volume)

	return 1
}

function getRecentMute(): boolean {
	let muted = localStorage.getItem("muted")

	if(muted) {
		switch(muted) {
			case "true":
				return true
			case "false":
				return false
			default:
				return undefined
		}
	}

	return false
}