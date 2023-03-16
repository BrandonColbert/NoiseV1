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

export type IVolume = Volume

export namespace IVolume {
	export interface Constructor {
		prototype: Volume
		new(): Volume
	}
}

let Volume: IVolume.Constructor

switch(process.platform) {
	case "win32": {
		interface VolumeConstructorWindows extends IVolume.Constructor {
			new(processId?: number): Volume
		}

		const addon = require("../../resources/addons/volume")
		Volume = addon.Volume as VolumeConstructorWindows
		break
	}
	case "linux":
		Volume = require("./volumePulseAudio").default as IVolume.Constructor
		break
	default:
		Volume = class implements Volume {
			isMuted(): boolean { return false }
			setMuted(_: boolean): void {}
			getVolume(): number { return 0 }
			setVolume(_: number): void {}
		}

		console.error(`Volume control not supported on '${process.platform}'`)
		break
}

export default Volume