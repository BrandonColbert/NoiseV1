import TextUtils from "../../utils/textUtils.js"
import Courier from "../../core/courier.js"
import PlaylistView from "./playlistView.js"
import View from "../view.js"
import Dropdown from "../dropdown.js"

export class EntrybarView implements View {
	public readonly playlistView: PlaylistView
	public readonly element: HTMLDivElement
	public readonly elements: EntrybarView.Elements
	#courier: Courier

	public constructor(playlistView: PlaylistView, element: HTMLDivElement) {
		this.playlistView = playlistView
		this.element = element
		this.elements = new EntrybarView.Elements(this)
	}

	public get courier(): Courier {
		return this.#courier
	}

	public set courier(value: Courier) {
		if(this.#courier == value)
			return

		//Remember selection
		if(value) {
			localStorage.setItem("courier", value.id)
			this.elements.courierTitle.textContent = value.name
		} else {
			localStorage.removeItem("courier")
			this.elements.courierTitle.textContent = "None"
		}

		this.#courier = value
	}

	public construct(): void {
		this.elements.add.addEventListener("click", this.onAddClick)
		this.elements.query.addEventListener("keydown", this.onQueryKeyDown)
		this.elements.query.addEventListener("input", this.onQueryInput)
		this.elements.courierSelector.addEventListener("click", this.onCourierSelectorClick)
	}

	public deconstruct(): void {
		this.courier = null

		this.elements.add.removeEventListener("click", this.onAddClick)
		this.elements.query.removeEventListener("keydown", this.onQueryKeyDown)
		this.elements.query.removeEventListener("input", this.onQueryInput)
		this.elements.courierSelector.removeEventListener("click", this.onCourierSelectorClick)
	}

	private async pushItem(): Promise<void> {
		let playlist = this.playlistView.playlist

		if(!playlist)
			return

		//Add the new item to the playlist
		let items = await playlist.getItems()
		items.push({query: this.elements.query.value, courier: this.courier?.id ?? undefined})
		await playlist.setItems(items)

		//Clear current entry, redisplay items, and make sure new item is visible
		this.elements.query.value = ""
		this.playlistView.elements.playlist.exhibit(_ => true)
		this.playlistView.elements.playlist.ensureVisibility(items.length - 1)
	}

	private onAddClick = async (_: MouseEvent) => {
		if(this.elements.query.value.length == 0)
			return

		await this.pushItem()
	}

	private onQueryKeyDown = async (event: KeyboardEvent) => {
		let input = event.target as HTMLInputElement

		switch(event.code) {
			case "Enter":
				if(input.value.length == 0)
					break

				await this.pushItem()
				break
		}
	}

	private onQueryInput = async (event: InputEvent) => {
		let input = event.target as HTMLInputElement

		this.playlistView.elements.playlist?.exhibit(item =>
			TextUtils
				.simplify(item.query)
				.includes(TextUtils.simplify(input.value))
		)
	}

	private onCourierSelectorClick = async (event: MouseEvent) => {
		let couriers = await Courier.all()

		Dropdown.show(
			couriers.map(c => ({
				text: c.name,
				callback: () => this.courier = c
			})),
			{target: event.target as HTMLElement, height: "25%"}
		)
	}
}

export namespace EntrybarView {
	export class Elements extends View.Children {
		public readonly add: HTMLButtonElement
		public readonly query: HTMLInputElement
		public readonly courierTitle: HTMLDivElement
		public readonly courierSelector: HTMLDivElement

		public constructor(view: EntrybarView) {
			super(view)
			this.add = this.querySelector("#add")
			this.query = this.querySelector("#query > input")
			this.courierTitle = this.querySelector("#courier > :nth-child(1)")
			this.courierSelector = this.querySelector("#courier")
		}
	}
}

export default EntrybarView