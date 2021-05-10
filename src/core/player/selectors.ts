/**
 * Query selectors to find elements on a website
 */
export default interface Selectors {
	/**
	 * Element that toggles playing/pausing of media
	 */
	togglePlay: string
	
	/**
	 * Element displaying the elapsed time for viewing the media
	 */
	elapsed: string

	/**
	 * Element displaying the total time of the media
	 */
	duration: string
}