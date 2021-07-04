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

// import {desktopCapturer, remote} from "electron"

// let getVolume: () => number = null
// let setVolume: (value: number) => void = null

// ;(async function() {
// 	let stream = await navigator.mediaDevices.getUserMedia({
// 		audio: true,
// 		video: false
// 	})

// 	let context = new AudioContext()
// 	let audioSourceNode = context.createMediaStreamSource(stream)
// 	let gainNode = context.createGain()

// 	audioSourceNode.connect(gainNode)
// 	gainNode.connect(context.destination)

// 	getVolume = () => {
// 		console.log(gainNode.gain.value)
// 		return gainNode.gain.value
// 	}

// 	setVolume = value => {
// 		console.log(stream)
// 		console.log(context)
// 		console.log(`${gainNode.gain.value} -> ${value}`)
// 		gainNode.gain.value = value
// 	}
// })()

// export default {
// 	getVolume: () => getVolume?.() ?? 1,
// 	setVolume: value => setVolume?.(value)
// } as Volume