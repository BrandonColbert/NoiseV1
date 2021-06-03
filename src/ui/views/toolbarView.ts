import Playlist from "../../core/playlist.js"
import Courier from "../../core/courier.js"
import PlaybackView from "./playbackView.js"

export default class ToolbarView implements View {
	public readonly element: HTMLElement
	private playbackView: PlaybackView
	private mediaTitle: HTMLDivElement
	private mediaSite: HTMLButtonElement

	public constructor(element: HTMLElement, playbackView: PlaybackView) {
		this.element = element
		this.playbackView = playbackView

		this.mediaTitle = element.querySelector("#info > #title")
		this.mediaSite = element.querySelector("#info > #site")

		this.element.querySelector("#previous-item").addEventListener("click", this.onPreviousItemClick)
		this.element.querySelector("#playpause").addEventListener("click", this.onPlaypauseClick)
		this.element.querySelector("#next-item").addEventListener("click", this.onNextItemClick)
		this.mediaSite.addEventListener("click", this.onMediaSiteClick)
	}

	public destroy(): void {
		this.element.querySelector("#previous-item").removeEventListener("click", this.onPreviousItemClick)
		this.element.querySelector("#playpause").removeEventListener("click", this.onPlaypauseClick)
		this.element.querySelector("#next-item").removeEventListener("click", this.onNextItemClick)
		this.mediaSite.removeEventListener("click", this.onMediaSiteClick)
	}

	public get volume(): number {
		return NaN
	}

	public set volume(value: number) {
		
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

	private onPreviousItemClick = (_: Event) => this.playbackView.playPrevious()
	private onNextItemClick = (_: Event) => this.playbackView.playNext()
	private onPlaypauseClick = async (_: Event) => await this.playbackView.playerView.player?.togglePlay()
	private onMediaSiteClick = (_: Event) => {}
}