import Playlist from "./core/playlist.js"
import DDListElement from "./ui/ddListElement.js"
import PlaybackView from "./ui/views/playbackView.js"

DDListElement.define()

const playback = new PlaybackView(document.querySelector("#playback"))

Playlist.all().then(async playlists => {
	if(playlists.length == 0)
		return

	await playback.playlistView.setPlaylist(playlists[0])
})