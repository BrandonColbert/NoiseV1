import Playlist from "../../core/playlist.js"
import Courier from "../../core/courier.js"
import PlaybackView from "./playbackView.js"
import Volume from "../../utils/volume.js"
import { remote } from "electron"

export default class ToolbarView implements View {
	public readonly element: HTMLElement
	private playbackView: PlaybackView
	private mediaTitle: HTMLDivElement
	private mediaSite: HTMLButtonElement
	private volumeIcon: HTMLDivElement
	private volumeSlider: HTMLInputElement

	public constructor(element: HTMLElement, playbackView: PlaybackView) {
		this.element = element
		this.playbackView = playbackView

		this.mediaTitle = element.querySelector("#info > #title")
		this.mediaSite = element.querySelector("#info > #site")
		this.volumeIcon = element.querySelector("#volume > div")
		this.volumeSlider = element.querySelector("#volume > input")

		this.refreshVolume()

		this.mediaSite.addEventListener("click", this.onMediaSiteClick)
		this.element.querySelector("#previous-item").addEventListener("click", this.onPreviousItemClick)
		this.element.querySelector("#playpause").addEventListener("click", this.onPlaypauseClick)
		this.element.querySelector("#next-item").addEventListener("click", this.onNextItemClick)
		this.volumeSlider.addEventListener("input", this.onVolumeSliderInput)
	}

	public destroy(): void {
		this.mediaSite.removeEventListener("click", this.onMediaSiteClick)
		this.element.querySelector("#previous-item").removeEventListener("click", this.onPreviousItemClick)
		this.element.querySelector("#playpause").removeEventListener("click", this.onPlaypauseClick)
		this.element.querySelector("#next-item").removeEventListener("click", this.onNextItemClick)
		this.volumeSlider.removeEventListener("input", this.onVolumeSliderInput)
	}

	public async refreshInfo(info?: {item: Playlist.Item, courier: Courier, result: Courier.Result}): Promise<void> {
		if(!info) {
			this.mediaTitle.textContent = "Untitled"
			this.mediaSite.textContent = "Unknown"
			return
		}

		this.mediaTitle.textContent = info.result.title ?? info.item.query
		this.mediaSite.textContent = info.courier.name
	}

	private refreshVolume(): void {
		let volume = Volume.getVolume()
		this.volumeSlider.valueAsNumber = volume

		if(volume == 0)
			this.volumeIcon.dataset.level = "off"
		else if(volume < 0.25)
			this.volumeIcon.dataset.level = "mute"
		else if(volume < 0.75)
			this.volumeIcon.dataset.level = "down"
		else
			this.volumeIcon.dataset.level = "up"
	}

	private onPreviousItemClick = (_: Event) => this.playbackView.playPrevious()
	private onNextItemClick = (_: Event) => this.playbackView.playNext()

	private onPlaypauseClick = async (_: Event) => {
		if(this.playbackView.started)
			await this.playbackView.playerView.player?.togglePlay()
		else
			await this.playbackView.play(0)
	}

	private onVolumeSliderInput = (event: Event) => {
		let target = event.target as HTMLInputElement
		Volume.setVolume(target.valueAsNumber)
		this.playbackView.playerView.element.executeJavaScript(`noise.volume.setVolume(${target.valueAsNumber})`)

		this.refreshVolume()
	}

	private onMediaSiteClick = (_: Event) => {
		for(let webContents of remote.webContents.getAllWebContents()) {
			webContents.openDevTools({mode: "detach"})
			webContents.executeJavaScript(`
				try {
					noise.volume.setVolume(0)
					console.log(noise.volume.getVolume())
				} catch(e) {
					console.log(e)
				}

				try {
					const Voume = require("app/js/utils/volume.js")
					Volume.setVolume(0)
					console.log(Volume.getVolume())
				} catch(e) {
					console.log(e)
				}
			`)
		}
	}
}