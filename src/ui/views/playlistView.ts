import {remote} from "electron"
import TextUtils from "../../utils/textUtils.js"
import Playlist from "../../core/playlist.js"
import Dropdown from "../dropdown.js"
import PlaylistElement from "../elements/playlistElement.js"
import PlaybackView from "./playbackView.js"
import View from "../view.js"
import EntrybarView from "./entrybarView.js"

export class PlaylistView implements View {
	public readonly playbackView: PlaybackView
	public readonly element: HTMLDivElement
	public readonly elements: PlaylistView.Elements
	public readonly views: PlaylistView.Views

	public constructor(playbackView: PlaybackView, element: HTMLDivElement) {
		this.playbackView = playbackView
		this.element = element
		this.elements = new PlaylistView.Elements(this)
		this.views = new PlaylistView.Views(this)
	}

	/** Active playlist */
	public get playlist(): Playlist {
		return this.elements.playlist?.value
	}

	public set playlist(value: Playlist) {
		if(value == this.playlist)
			return

		//Remember selection
		if(value)
			localStorage.setItem("playlist", value.id)
		else
			localStorage.removeItem("playlist")

		//Reset visuals
		this.playbackView.reset()

		//Remove previous playlist
		this.playlist?.events.forget("rename", this.onRename)
		this.playlist?.events.forget("delete", this.onDelete)
		this.elements.playlist?.remove()

		if(!value) {
			this.elements.playlist = null
			return
		}

		//Create visuals
		this.elements.playlist = new PlaylistElement(value)
		this.elements.playlist.playback = this.playbackView
		this.element.querySelector("#items").append(this.elements.playlist)

		//Acquire name
		this.playlist.getName().then(name => this.elements.title.textContent = name)

		//Add listeners
		this.playlist.events.on("rename", this.onRename)
		this.playlist.events.on("delete", this.onDelete)
	}

	public construct(): void {
		this.views.constructAll()
		this.elements.title.textContent = "Unselected"

		//Add listeners
		this.elements.selector.addEventListener("click", this.onSelectorClick)
		this.elements.title.addEventListener("contextmenu", this.onTitleContext)
		this.elements.options.addEventListener("click", this.onOptionsClick)
	}

	public deconstruct(): void {
		this.views.deconstructAll()

		this.elements.playlist = null

		//Remove listeners
		this.elements.selector.removeEventListener("click", this.onSelectorClick)
		this.elements.title.removeEventListener("contextmenu", this.onTitleContext)
		this.elements.options.removeEventListener("click", this.onOptionsClick)
	}

	/**
	 * Select the item to be highlighted as playing.
	 * 
	 * Only a single item may be highlighted at any given time.
	 * @param index Index of the item
	 */
	public highlightItemAt(index: number): void {
		if(!this.elements.playlist)
			return

		this.clearHighlights()
		this.elements.playlist.children[index].classList.add("playingItem")
	}

	/**
	 * Removes existing highlights
	 */
	public clearHighlights(): void {
		for(let element of this.elements.playlist.children)
			element.classList.remove("playingItem")
	}

	private onRename = (event: Playlist.Events.Rename) => {
		this.elements.title.textContent = event.newName
	}

	private onDelete = async () => {
		let playlists = await Playlist.all()

		//Switch to next playlist when current is deleted
		if(playlists.length > 0)
			this.playlist = playlists[0]
		else
			this.deconstruct()
	}

	private onSelectorClick = async (event: MouseEvent) => {
		let playlists = await Playlist.all()

		//Populate with existing playlists
		let entries = await Promise.all(playlists.map(async p => ({
			text: await p.getName(),
			callback: async () => this.playlist = p
		})))

		//Additional entry to create a new playlist
		entries.push({
			text: "+ New Playlist",
			callback: async () => this.playlist = await Playlist.create()
		})

		let dropdown = Dropdown.show(entries, {
			height: "25%",
			target: event.target as HTMLElement
		})

		if(!this.playlist)
			return

		let ids = playlists.map(p => p.id)
		dropdown.element.children[ids.indexOf(this.playlist.id)].scrollIntoView({block: "center"})
	}

	private onTitleContext = async (event: MouseEvent) => {
		event.preventDefault()

		if(!this.playlist)
			return

		Dropdown.show([
			{text: "Rename", callback: async () => {
				let result = await TextUtils.rename(this.elements.title)

				if(!result)
					return

				if(await this.playlist.setName(result))
					return

				this.elements.title.textContent = await this.playlist.getName()
			}},
			{text: "Export as .json", callback: async () => await this.playlist.export()},
			{text: "Delete", callback: async () => {
				let result = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
					type: "question",
					title: `Delete '${await this.playlist.getName()}'`,
					message: `Are you sure you want to delete the playlist '${await this.playlist.getName()}'?`,
					detail: "The playlist may not be recoverable.",
					buttons: ["Ok", "Cancel"]
				})

				switch(result.response) {
					case 0:
						await this.playlist.delete()
						break
				}
			}}
		], {target: event.target as HTMLElement})
	}

	private onOptionsClick = async (event: MouseEvent) => {
		Dropdown.show([
			{text: "Import playlist", callback: async () => {
				let playlists = await Playlist.import()

				if(playlists?.length ?? 0 == 0)
					return

				this.playlist = playlists[playlists.length - 1]
			}},
			{text: "View helpers", callback: async () => await remote.getCurrentWindow().loadFile("app/helpers.html")},
			{text: "Edit settings", callback: async () => await remote.getCurrentWindow().loadFile("app/settings.html")},
			{text: "Inspect player", callback: () => this.playbackView.views.playerView.element.openDevTools()}
		], {target: event.target as Element})
	}
}

export namespace PlaylistView {
	export class Elements extends View.Children {
		public readonly selector: HTMLButtonElement
		public readonly title: HTMLDivElement
		public readonly options: HTMLButtonElement
		public playlist: PlaylistElement

		public constructor(view: PlaylistView) {
			super(view)
			this.selector = this.querySelector("#playlists > button")
			this.title = this.querySelector("#playlists > div")
			this.options = this.querySelector("#options")
		}
	}

	export class Views extends View.Viewset {
		public readonly entrybarView: EntrybarView

		public constructor(view: PlaylistView) {
			super(view)
			this.add("entrybarView", new EntrybarView(view, this.querySelector("#entrybar")))
		}
	}
}

export default PlaylistView