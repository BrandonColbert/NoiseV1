import Courier from "./courier.js"
import Player from "./player.js"
import Playlist from "./playlist.js"

const {remote} = require("electron")
const fs = require("fs")
const {v4: uuidv4} = require("uuid")

const configPath = `${process.env.PORTABLE_EXECUTABLE_DIR ?? remote.app.getAppPath()}\\config`
const playlistPath = `${configPath}\\playlists`
const courierPath = `${configPath}\\couriers`
const playerPath = `${configPath}\\players`
const settingsPath = `${configPath}\\settings.json`

/** @type {Map.<string, import("./playlist").Info>} */
let playlists = new Map()
/** @type {Map.<string, import("./courier").Info>} */
let couriers = new Map()
/** @type {import("./player").Info[]} */
let players = []
/** @type {Settings} */
let settings = {
	defaultCourier: "",
	playlistOrder: []
}

Array.from([configPath, playlistPath, courierPath, playerPath]).forEach(e => {
	if(!fs.existsSync(e))
		fs.mkdirSync(e)
})

if(!fs.existsSync(settingsPath))
	fs.writeFileSync(settingsPath, JSON.stringify(settings))

/**
 * Contains all playlists and couriers
 */
export default class Noise {
	/** List of playlist ids in their associated order */
	static get playlists() {
		return [...playlists.keys()]
	}

	/** List of courier ids */
	static get couriers() {
		return [...couriers.keys()]
	}

	/** Settings */
	static get settings() {
		return settings
	}

	/** Reloads info from the filesystem */
	static reload() {
		settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"))

		players = []
		couriers.clear()
		playlists = new Map(settings.playlistOrder.map(e => [e, null]))

		for(let name of fs.readdirSync(playerPath))
			players.push(JSON.parse(fs.readFileSync(`${playerPath}\\${name}`, "utf8")))

		for(let name of fs.readdirSync(courierPath))
			couriers.set(
				name.slice(0, -5),
				JSON.parse(fs.readFileSync(
					`${courierPath}\\${name}`,
					"utf8"
				))
			)

		for(let name of fs.readdirSync(playlistPath))
			playlists.set(
				name.slice(0, -5),
				JSON.parse(fs.readFileSync(
					`${playlistPath}\\${name}`,
					"utf8"
				))
			)

		players.sort()
		couriers = new Map([...couriers.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name)))
		for(let id of settings.playlistOrder)
			if(playlists.get(id) == null)
				playlists.delete(id)
		settings.playlistOrder = [...playlists.keys()]
	}

	/** Saves settings */
	static saveSettings() {
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, "\t"))
	}

	/**
	 * @param {string} id Playlist id
	 * @returns {Playlist} New playlist instance from id
	 */
	static loadPlaylist(id) {
		return new Playlist(id, playlists.get(id))
	}

	/**
	 * Saves the playlist
	 * @param {Playlist} playlist Playlist instance
	 */
	static savePlaylist(playlist) {
		const info = playlist.info
		playlists.set(playlist.id, info)
		fs.writeFileSync(`${playlistPath}\\${playlist.id}.json`, JSON.stringify(info, null, "\t"))
	}

	/**
	 * @param {string} name Playlist name
	 * @returns {Playlist} New instance of the created playlist
	 */
	static createPlaylist(name) {
		let id = uuidv4()
		let info = {name: name, items: []}
		playlists.set(id, info)
		fs.writeFileSync(`${playlistPath}\\${id}.json`, JSON.stringify(info, null, "\t"))

		settings.playlistOrder.push(id)
		Noise.saveSettings()

		return Noise.loadPlaylist(id)
	}

	/**
	 * Deletes the playlist with the id
	 * @param {string} id Playlist id
	 */
	static deletePlaylist(id) {
		playlists.delete(id)
		fs.unlinkSync(`${playlistPath}\\${id}.json`)

		settings.playlistOrder = settings.playlistOrder.filter(e => e != id)
		Noise.saveSettings()
	}

	/**
	 * Export playlist with file dialog
	 * @param {string} id Playlist id
	 */
	static async exportPlaylist(id) {
		const info = playlists.get(id)

		let {canceled, filePath} = await remote.dialog.showSaveDialog({
			defaultPath: `${info.name}.json`,
			filters: [{
				name: "JavaScript Object Notation",
				extensions: ["json"]
			}]
		})

		if(!canceled)
			fs.writeFile(filePath, JSON.stringify(info, null, "\t"), "utf8", () => {})
	}

	/**
	 * @param {string} id Courier id
	 * @returns {Courier} New courier instance from id
	 */
	static loadCourier(id) {
		return new Courier(couriers.get(id))
	}

	/**
	 * @param {string} url Url to find compatible player
	 * @returns {Player} New player instance compatible with the url
	 */
	static loadPlayer(url) {
		const info = players.find(e => Player.compatible(e.site, url))

		return info ? new Player(info) : null
	}
}

/**
 * @typedef {{defaultCourier: string, playlistOrder: string[]}} Settings
 */