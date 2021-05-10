/**
 * Playlist item
 */
export default interface Item {
	/**
	 * Query describing the media to be played
	 */
	query: string

	/**
	 * Courier to find media using the query
	 * 
	 * Default courier in Noise config is used if left unspecified
	 */
	courier?: string
}

/**
 * @returns Whether the items are the same
 */
export function compare(a: Item, b: Item): boolean {
	if(a.query != b.query)
		return false

	if(a.courier != b.courier)
		return false

	return true
}