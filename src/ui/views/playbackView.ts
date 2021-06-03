import Courier from "../../core/courier.js"
import Playback from "../../core/playback.js"
import PlayerView from "./playerView.js"
import PlaylistView from "./playlistView.js"
import ToolbarView from "./toolbarView.js"

export default class PlaybackView extends Playback implements View {
	public readonly element: HTMLElement
	public readonly playerView: PlayerView
	public readonly playlistView: PlaylistView
	public readonly toolbarView: ToolbarView

	public constructor(element: HTMLElement) {
		super()
		this.element = element
		this.playerView = new PlayerView(element.querySelector("#player"))
		this.toolbarView = new ToolbarView(element.querySelector("#toolbar"), this)
		this.playlistView = new PlaylistView(element.querySelector("#playlist"), this)

		//Allow resizing
		let resizing = false

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
				this.element.style.gridTemplateColumns = w > 1 ? `${2 - w}fr 1fr` : `1fr ${w}fr`
			}
		})
	}

	public destroy(): void {
		this.playerView.destroy()
		this.playlistView.destroy()
		this.toolbarView.destroy()
	}

	public async reset(): Promise<void> {
		await super.reset()
		await this.playerView.navigate()
		await this.toolbarView.refreshInfo()
		this.playlistView.highlightItemAt()
	}

	public async play(index: number): Promise<void> {
		let items = await this.playlistView.playlist.getItems()

		if(index < 0)
			return
		if(index >= items.length) {
			await this.reset()
			return
		}

		this.itemIndex = index
		this.playlistView.highlightItemAt(index)

		let item = items[index]
		let courier = item.courier ? await Courier.load(item.courier) : this.playlistView.courier
		let result = await courier.find(item.query)

		await this.toolbarView.refreshInfo({item: item, courier: courier, result: result})

		await this.playerView.navigate(result.url)
		await this.playerView.player.resume()

		this.toolbarView.element.querySelector<HTMLElement>("#playpause").dataset["playing"] = (await this.playerView.player.isPlaying()).toString()
		await this.playerView.player.events.on("play", () => this.toolbarView.element.querySelector<HTMLElement>("#playpause").dataset["playing"] = "true")
		await this.playerView.player.events.on("pause", () => this.toolbarView.element.querySelector<HTMLElement>("#playpause").dataset["playing"] = "false")
		await this.playerView.player.events.on("end", async () => await this.playNext())
	}
}