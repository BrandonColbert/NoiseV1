import Selectors from "./selectors.js"

/**
 * Website media player information
 */
export default interface Info {
	/**
	 * Website name displayed to the user
	 */
	name: string

	/**
	 * Regex string to check whether the URL is compatible with the player
	 */
	site: string

	/**
	 * Query selectors for page elements
	 */
	selectors: Selectors

	/**
	 * Whether media immediately starts playing
	 */
	autoplay?: boolean
}