import {remote} from "electron"
import TextUtils from "../../utils/textUtils.js"
import Playlist from "../../core/playlist.js"
import Dropdown from "../dropdown.js"
import PlaylistElement from "../elements/playlistElement.js"
import PlaybackView from "./playbackView.js"
import Courier from "../../core/courier.js"

export default class PlaylistView implements View {
	public readonly element: HTMLElement
	private playbackView: PlaybackView
	private playlistElement: PlaylistElement
	private playlistSelectionButton: HTMLButtonElement
	private playlistTitle: HTMLElement
	private optionsButton: HTMLButtonElement
	private entrybarAdd: HTMLButtonElement
	private entrybarQuery: HTMLInputElement
	private courierTitle: HTMLDivElement
	private courierSelection: HTMLDivElement
	#courier: Courier = null

	public constructor(element: HTMLElement, playbackView: PlaybackView) {
		this.element = element
		this.playbackView = playbackView

		this.playlistSelectionButton = this.element.querySelector("#playlists > button")
		this.playlistTitle = this.element.querySelector("#playlists > div")
		this.optionsButton = this.element.querySelector("#options")
		this.entrybarAdd = this.element.querySelector("#entrybar > #add")
		this.entrybarQuery = this.element.querySelector("#entrybar > #query > input")
		this.courierTitle = this.element.querySelector("#entrybar > #courier > :nth-child(1)")
		this.courierSelection = this.element.querySelector("#entrybar > #courier")

		this.playlistSelectionButton.addEventListener("click", this.onPlaylistSelectionButtonClick)
		this.playlistTitle.addEventListener("contextmenu", this.onPlaylistTitleContext)
		this.optionsButton.addEventListener("click", this.onOptionsButtonClick)
		this.entrybarAdd.addEventListener("click", this.onEntrybarAddClick)
		this.entrybarQuery.addEventListener("keydown", this.onEntrybarQueryKeyDown)
		this.entrybarQuery.addEventListener("input", this.onEntrybarQueryInput)
		this.courierSelection.addEventListener("click", this.onCourierSelectionClick)
	}

	/** Active playlist */
	public get playlist(): Playlist {
		return this.playlistElement
	}

	/** Selected courier */
	public get courier(): Courier {
		return this.#courier
	}

	public destroy(): void {
		this.playlistElement?.value.remove()

		this.playlistSelectionButton.removeEventListener("click", this.onPlaylistSelectionButtonClick)
		this.playlistTitle.removeEventListener("contextmenu", this.onPlaylistTitleContext)
		this.optionsButton.removeEventListener("click", this.onOptionsButtonClick)
		this.entrybarAdd.removeEventListener("click", this.onEntrybarAddClick)
		this.entrybarQuery.removeEventListener("keydown", this.onEntrybarQueryKeyDown)
		this.entrybarQuery.removeEventListener("input", this.onEntrybarQueryInput)
		this.courierSelection.removeEventListener("click", this.onCourierSelectionClick)
	}

	/**
	 * Select the item to be highlighted as playing.
	 * 
	 * Only a single item may be highlighted at any given time.
	 * @param index Index of the item
	 */
	public highlightItemAt(index: number = null): void {
		if(!this.playlistElement)
			return

		let itemElements = [...this.playlistElement]

		for(let element of itemElements)
			element.value.classList.remove("playingItem")

		if(index == null)
			return

		let itemElement = itemElements[index]
		itemElement.value.classList.add("playingItem")
	}

	public async setPlaylist(playlist: Playlist): Promise<void> {
		//Reset view
		this.playlistTitle.textContent = "Unselected"
		this.playlistElement?.value.remove()
		this.playlistElement = null

		await this.playbackView.reset()

		//Halt if no playlist
		if(playlist == null)
			return

		//Setup new view
		this.playlistTitle.textContent = await playlist.getName()

		this.playlistElement = await PlaylistElement.createElement(playlist, this.playbackView)
		this.element.querySelector("#items").append(this.playlistElement.value)

		//Register events
		this.playlistElement.events.on(
			"rename",
			details => this.playlistTitle.textContent = details.newName
		)

		this.playlist.events.on("delete", async () => {
			let playlists = await Playlist.all()

			if(playlists.length == 0)
				return
		
			await this.setPlaylist(playlists[0])
		})
	}

	protected setCourier(value: Courier): void {
		this.courierTitle.textContent = value.name
		this.#courier = value
	}

	private onPlaylistSelectionButtonClick = async (event: Event) => {
		let playlists = await Playlist.all()

		//Populate with existing playlists
		let entries = await Promise.all(playlists.map(async p => ({
			text: await p.getName(),
			callback: async () => await this.setPlaylist(p)
		})))

		//Additional entry to create a new playlist
		entries.push({
			text: "+ New Playlist",
			callback: async () => await this.setPlaylist(await Playlist.create())
		})

		let dropdown = Dropdown.show(entries, {
			height: "25%",
			target: event.target as HTMLElement
		})

		let ids = playlists.map(p => p.id)

		if(!this.playlist)
			return

		dropdown.element.children[ids.indexOf(this.playlist.id)].scrollIntoView({block: "center"})
	}

	private onPlaylistTitleContext = async (event: Event) => {
		event.preventDefault()

		if(!this.playlist)
			return

		Dropdown.show([
			{text: "Rename", callback: async () => {
				let result = await TextUtils.rename(event.target as HTMLElement)

				if(result == null)
					return

				if(await this.playlist.setName(result))
					return

				;(event.target as HTMLElement).textContent = await this.playlist.getName()
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

	private onOptionsButtonClick = async (event: Event) => {
		Dropdown.show([
			{text: "Import playlist", callback: async () => {
				let playlists = await Playlist.import()

				if(playlists?.length ?? 0 == 0)
					return

				await this.setPlaylist(playlists[playlists.length - 1])
			}},
			{text: "View helpers"},
			{text: "Edit settings"},
			{text: "Inspect player", callback: () => this.playbackView.playerView.element.openDevTools()}
		], {target: event.target as Element})
	}

	private async addQueryItem(): Promise<void> {
		let items = await this.playlist.getItems()
		items.push({query: this.entrybarQuery.value, courier: this.courier?.id ?? undefined})
		await this.playlist.setItems(items)

		this.entrybarQuery.value = ""
		this.playlistElement.exhibit(_ => true)
		this.playlistElement.ensureVisibility(items.length - 1)
	}

	private onEntrybarAddClick = async (_: MouseEvent) => {
		if(this.entrybarQuery.value.length == 0)
			return

		await this.addQueryItem()
	}

	private onEntrybarQueryKeyDown = async (event: KeyboardEvent) => {
		let input = event.target as HTMLInputElement

		switch(event.code) {
			case "Enter":
				if(input.value.length == 0)
					break

				await this.addQueryItem()
				break
		}
	}

	private onEntrybarQueryInput = async (event: InputEvent) => {
		let input = event.target as HTMLInputElement
		this.playlistElement.exhibit(item => TextUtils.simplify(item.query).includes(TextUtils.simplify(input.value)))
	}

	private onCourierSelectionClick = async (event: MouseEvent) => {
		let couriers = await Courier.all()

		Dropdown.show(
			couriers.map(c => ({
				text: c.name,
				callback: () => this.setCourier(c)
			})),
			{target: event.target as HTMLElement, height: "25%"}
		)
	}
}