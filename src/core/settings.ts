/**
 * Noise settings
 */
export default interface Settings {
	/**
	 * Default courier to use when adding a new media query
	 */
	defaultCourier: string

	/**
	 * Order of the playlists to display to the user based on their IDs
	 */
	playlistOrder: string[]

	/** Duration in milliseconds to remember Accumulator search times */
	recency: number

	/** Maximum number of Accumulator searches within recency seconds before waiting */
	thresholdWait: number

	/** Maximum number of Accumulator searches within recency seconds before aborting */
	thresholdAbort: number
}