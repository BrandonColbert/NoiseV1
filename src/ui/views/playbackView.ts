import Dispatcher from "../../utils/dispatcher.js"
import Courier from "../../core/courier.js"
import Playback from "../../core/playback.js"
import View from "../view.js"
import PlayerView from "./playerView.js"
import PlaylistView from "./playlistView.js"
import ToolbarView from "./toolbarView.js"
import Playlist from "../../core/playlist.js"

export class PlaybackView extends Playback implements View {
	public readonly element: HTMLElement
	public readonly views: PlaybackView.Views
	public readonly events: Dispatcher<PlaybackView.Events>

	public constructor(element: HTMLElement) {
		super()
		this.element = element
		this.events = new Dispatcher(["play", "reset"])
		this.views = new PlaybackView.Views(this)
	}

	public construct(): void {
		this.views.constructAll()

		//Allow resizing
		// let resizing = false

		// document.body.addEventListener("mousedown", e => {
		// 	let thickness = 10
		// 	let [x, y] = [e.clientX, e.clientY]
		// 	let pr = this.views.playlistView.element.getBoundingClientRect()

		// 	if(pr.top <= y && y <= pr.bottom && Math.abs(x - pr.left) <= thickness) {
		// 		resizing = true
		// 		document.body.style.cursor = "move"
		// 		document.body.style.pointerEvents = "none"
		// 	}
		// })

		// document.addEventListener("mouseup", e => {
		// 	resizing = false
		// 	document.body.style.cursor = ""
		// 	document.body.style.pointerEvents = ""
		// })

		// document.addEventListener("mousemove", e => {
		// 	if(resizing) {
		// 		document.getSelection()?.empty()

		// 		let x = e.clientX
		// 		let w = Math.max(0, Math.min((window.innerWidth - x) / window.innerWidth * 2, 2))
		// 		this.element.style.gridTemplateColumns = w > 1 ? `${2 - w}fr 1fr` : `1fr ${w}fr`
		// 	}
		// })
	}

	public deconstruct(): void {
		this.views.deconstructAll()
	}

	public override async reset(): Promise<void> {
		await super.reset()
		await this.views.playerView.navigate()
		this.views.playlistView.clearHighlights()

		await this.events.fire("reset")
	}

	public override async play(index: number): Promise<void> {
		if(!this.views.playlistView.playlist)
			return

		let items = await this.views.playlistView.playlist.getItems()

		if(index < 0)
			return
		if(index >= items.length) {
			await this.reset()
			return
		}

		let oldIndex = this.itemIndex
		this.itemIndex = index
		this.views.playlistView.highlightItemAt(index)

		let item = items[index]
		let courier = item.courier ? await Courier.load(item.courier) : this.views.playlistView.views.entrybarView.courier

		if(!courier)
			throw new Error(`Unable to find courier for item ${item}`)

		let result = await courier.find(item.query)

		if(!result)
			throw new Error(`Unable to find media for item ${item}`)

		await this.views.playerView.navigate(result.url)
		await this.views.playerView.player.resume()
		await this.events.fire("play", {
			oldIndex: oldIndex,
			newIndex: index,
			item: item,
			media: result
		})

		this.views.playerView.player.events.on("play", () => this.views.toolbarView.playing = true)
		this.views.playerView.player.events.on("pause", () => this.views.toolbarView.playing = false)
		this.views.playerView.player.events.on("end", async () => await this.playNext())
	}
}

export namespace PlaybackView {
	export class Views extends View.Viewset {
		public readonly playlistView: PlaylistView
		public readonly playerView: PlayerView
		public readonly toolbarView: ToolbarView
		
		public constructor(view: PlaybackView) {
			super(view)
			this.add("playerView", new PlayerView(this.querySelector("#player")))
			this.add("toolbarView", new ToolbarView(view, this.querySelector("#toolbar")))
			this.add("playlistView", new PlaylistView(view, this.querySelector("#playlist")))
		}
	}

	export interface Events {
		/** When a new item has been successfully been played */
		play: Events.Play

		/** When playback has been reset */
		reset: void
	}

	export namespace Events {
		export interface Play {
			oldIndex: number
			newIndex: number
			item: Playlist.Item
			media: Courier.Result
		}
	}
}

export default PlaybackView