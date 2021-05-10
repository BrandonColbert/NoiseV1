import Pipe from "./pipe.js"

export default interface Info {
	/**
	 * Name of the courier that finds the media
	 */
	name: string

	/**
	 * Description of the process to extract candidates from the courier's page
	 */
	pipes: Pipe[]
}