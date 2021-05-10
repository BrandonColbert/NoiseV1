import Item from "./item.js"

interface ItemsChangedEvent {
	oldItems: Item[]
	newItems: Item[]
}

interface RenamedEvent {
	newName: string
	oldName: string
}

export default interface Events {
	//The playlist's items changed
	itemsChanged: ItemsChangedEvent

	//The playlist was renamed
	renamed: RenamedEvent

	//The playlist was deleted
	deleted: null
}