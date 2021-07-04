import {remote} from "electron"
import PlaybackView from "./playbackView.js"
import Volume from "../../utils/volume.js"
import View from "../view.js"

export class ToolbarView implements View {
	public readonly playbackView: PlaybackView
	public readonly element: HTMLElement
	public readonly elements: ToolbarView.Elements

	public constructor(playbackView: PlaybackView, element: HTMLElement) {
		this.playbackView = playbackView
		this.element = element
		this.elements = new ToolbarView.Elements(this)
	}

	/** Which icon the playpause icon is */
	public get playing(): boolean {
		switch(this.elements.playpause.dataset.playing) {
			case "true":
				return true
			case "false":
				return false
			default:
				return undefined
		}
	}

	public set playing(value: boolean) {
		this.elements.playpause.dataset.playing = value.toString()
	}

	public construct(): void {
		this.resetInfo()
		this.updateVolume()

		this.playbackView.events.on("play", this.onPlaybackPlay)
		this.playbackView.events.on("reset", this.onPlaybackReset)
		this.elements.mediaSite.addEventListener("click", this.onMediaSiteClick)
		this.elements.playPrevious.addEventListener("click", this.onPlayPreviousClick)
		this.elements.playpause.addEventListener("click", this.onPlaypauseClick)
		this.elements.playNext.addEventListener("click", this.onPlayNextClick)
		this.elements.volumeSlider.addEventListener("input", this.onVolumeSliderInput)
	}

	public deconstruct(): void {
		this.resetInfo()

		this.playbackView.events.forget("play", this.onPlaybackPlay)
		this.playbackView.events.forget("reset", this.onPlaybackReset)
		this.elements.mediaSite.removeEventListener("click", this.onMediaSiteClick)
		this.elements.playPrevious.removeEventListener("click", this.onPlayPreviousClick)
		this.elements.playpause.removeEventListener("click", this.onPlaypauseClick)
		this.elements.playNext.removeEventListener("click", this.onPlayNextClick)
		this.elements.volumeSlider.removeEventListener("input", this.onVolumeSliderInput)
	}

	private updateVolume(): void {
		let volume = Volume.getVolume()
		this.elements.volumeSlider.valueAsNumber = volume

		if(volume == 0)
			this.elements.volumeIcon.dataset.level = "off"
		else if(volume < 0.25)
			this.elements.volumeIcon.dataset.level = "mute"
		else if(volume < 0.75)
			this.elements.volumeIcon.dataset.level = "down"
		else
			this.elements.volumeIcon.dataset.level = "up"
	}

	private resetInfo(): void {
		this.playing = false
		this.elements.mediaTitle.style.display = "none"
		this.elements.mediaSite.style.display = "none"
	}

	private onPlaybackPlay = async (event: PlaybackView.Events.Play) => {
		this.elements.mediaTitle.style.display = null
		this.elements.mediaSite.style.display = null

		this.playing = await this.playbackView.views.playerView.player.isPlaying()
		this.elements.mediaTitle.textContent = event.media.title ?? event.item.query
		this.elements.mediaSite.textContent = this.playbackView.views.playerView.player?.name ?? "?"
	}

	private onPlaybackReset = () => {
		this.resetInfo()
	}

	private onMediaSiteClick = async (_: Event) => {
		let player = this.playbackView.views.playerView.player

		if(!player)
			return

		await remote.getCurrentWindow().loadFile(
			"app/descriptor.html",
			{hash: `player:${player.id}`
		})
	}

	private onPlayPreviousClick = (_: MouseEvent) => this.playbackView.playPrevious()
	private onPlayNextClick = (_: MouseEvent) => this.playbackView.playNext()

	private onPlaypauseClick = async (_: MouseEvent) => {
		if(this.playbackView.started)
			await this.playbackView.views.playerView.player?.togglePlay()
		else
			await this.playbackView.play(0)
	}

	private onVolumeSliderInput = (event: Event) => {
		let target = event.target as HTMLInputElement
		Volume.setVolume(target.valueAsNumber)

		console.log(Math.round(target.valueAsNumber * 100))

		// this.playbackView.playerView.element.executeJavaScript(`noise.volume.setVolume(${target.valueAsNumber})`)

		// for(let webContents of remote.webContents.getAllWebContents()) {
		// 	webContents.executeJavaScript(`
		// 		try {
		// 			noise.volume.setVolume(${target.valueAsNumber})
		// 			console.log(noise.volume.getVolume())
		// 		} catch(e) {
		// 			console.log(e)
		// 		}

		// 		try {
		// 			const Voume = require("app/js/utils/volume.js")
		// 			Volume.setVolume(${target.valueAsNumber})
		// 			console.log(Volume.getVolume())
		// 		} catch(e) {
		// 			console.log(e)
		// 		}
		// 	`)
		// }

		this.updateVolume()
	}
}

export namespace ToolbarView {
	export class Elements extends View.Children {
		public readonly mediaTitle: HTMLDivElement
		public readonly mediaSite: HTMLButtonElement
		public readonly playPrevious: HTMLButtonElement
		public readonly playNext: HTMLButtonElement
		public readonly playpause: HTMLButtonElement
		public readonly volumeIcon: HTMLDivElement
		public readonly volumeSlider: HTMLInputElement

		public constructor(view: ToolbarView) {
			super(view)
			this.mediaTitle = this.querySelector("#info > #title")
			this.mediaSite = this.querySelector("#info > #site")
			this.playPrevious = this.querySelector("#previous-item")
			this.playNext = this.querySelector("#next-item")
			this.playpause = this.querySelector("#playpause")
			this.volumeIcon = this.querySelector("#volume > div")
			this.volumeSlider = this.querySelector("#volume > input")
		}
	}
}

export default ToolbarView