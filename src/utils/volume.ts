const addon = require("../../resources/addons/volume")

/**
 * Application-wide volume interface
 */
interface Volume {
	/**
	 * @returns Whether the application is muted
	 */
	isMuted(): boolean

	/**
	 * Set application mute status
	 * @param value Whether audio should be muted
	 */
	setMuted(value: boolean): void

	/**
	 * @returns The application's volume in the range of 0 to 1
	 */
	getVolume(): number

	/**
	 * Sets the application's volume.
	 * 
	 * The value will be clamped to the range of [0, 1].
	 * @param value A value between 0 and 1
	 */
	setVolume(value: number): void
}

let Volume: {
	prototype: Volume
	new(processId?: number): Volume
} = addon.Volume

export default Volume