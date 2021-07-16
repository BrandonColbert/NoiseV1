import {remote} from "electron"
import PlaybackView from "./playbackView.js"
import Volume from "../../utils/volume.js"
import View from "../view.js"

export class ToolbarView implements View {
	public readonly playbackView: PlaybackView
	public readonly element: HTMLElement
	public readonly elements: ToolbarView.Elements
	#volume: Volume

	public constructor(playbackView: PlaybackView, element: HTMLElement) {
		this.playbackView = playbackView
		this.element = element
		this.elements = new ToolbarView.Elements(this)
		this.#volume = new Volume()
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

	public get volume(): number {
		return this.elements.volumeSlider.valueAsNumber
	}

	public set volume(value: number) {	
		if(value == 0)
			this.elements.volumeIcon.dataset.level = "low"
		else if(value < 0.5)
			this.elements.volumeIcon.dataset.level = "medium"
		else
			this.elements.volumeIcon.dataset.level = "high"

		this.elements.volumeSlider.valueAsNumber = value
	}

	public get muted(): boolean {
		switch(this.elements.volumeIcon.dataset.muted) {
			case "true":
				return true
			case "false":
				return false
			default:
				return undefined
		}
	}

	public set muted(value: boolean) {
		this.elements.volumeIcon.dataset.muted = value.toString()
	}

	public construct(): void {
		this.resetInfo()

		this.playbackView.events.on("play", this.onPlaybackPlay)
		this.playbackView.events.on("reset", this.onPlaybackReset)
		this.elements.mediaSite.addEventListener("click", this.onMediaSiteClick)
		this.elements.playPrevious.addEventListener("click", this.onPlayPreviousClick)
		this.elements.playpause.addEventListener("click", this.onPlaypauseClick)
		this.elements.playNext.addEventListener("click", this.onPlayNextClick)
		this.elements.volumeSlider.addEventListener("input", this.onVolumeSliderInput)
		this.elements.volumeIcon.addEventListener("click", this.onVolumeIconClick)
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
		this.elements.volumeIcon.removeEventListener("click", this.onVolumeIconClick)
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
		this.elements.mediaTitle.title = this.elements.mediaTitle.textContent
		this.elements.mediaSite.textContent = this.playbackView.views.playerView.player?.name ?? "?"

		this.#volume.setVolume(this.volume)
		this.#volume.setMuted(this.muted)
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

	private onVolumeSliderInput = () => {
		this.volume = this.elements.volumeSlider.valueAsNumber

		this.#volume.setVolume(this.volume)
		localStorage.setItem("volume", this.volume.toString())
	}

	private onVolumeIconClick = () => {
		this.muted = !this.muted

		this.#volume.setMuted(this.muted)
		localStorage.setItem("muted", this.muted.toString())
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