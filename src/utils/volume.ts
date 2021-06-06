/**
 * Application-wide volume interface
 */
interface Volume {
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

export default require("../../resources/addons/volume") as Volume