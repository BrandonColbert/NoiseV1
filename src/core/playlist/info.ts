import Item from "./item.js"

/**
 * Playlist information
 */
export default interface Info {
	/**
	 * Name displayed to user
	 */
	name: string

	/**
	 * Playlist items
	 */
	items: Item[]
}