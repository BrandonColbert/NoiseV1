import {exec, execSync} from "child_process"
import {IVolume} from "./volume.js"

/**
 * Control volume through pulseaudio command
 * TODO: Switch native addon using libpulse-dev
 */
export default class VolumePulseAudio implements IVolume {
	private pid: number
	private masp: SinkInput

	constructor(pid?: number) {
		this.pid = pid ?? process.ppid
	}

	public isMuted(): boolean {
		switch(this.mainAudioSubprocess?.mute) {
			case "yes":
				return true
			case "no":
				return false
			default:
				return false
		}
	}

	public setMuted(value: boolean): void {
		exec(`pactl set-sink-input-mute ${this.mainAudioSubprocess?.index ?? -1} ${value ? 1 : 0}`)
	}

	public getVolume(): number {
		return Math.max(this.mainAudioSubprocess?.volume.left ?? 0, this.mainAudioSubprocess?.volume.right ?? 0)
	}

	public setVolume(value: number): void {
		exec(`pactl set-sink-input-volume ${this.mainAudioSubprocess?.index ?? -1} ${Math.round(value * 100)}%`)
	}

	private get mainAudioSubprocess(): SinkInput {
		if(this.masp)
			if(execSync("pactl list sink-inputs").indexOf(`Sink Input #${this.masp.index}`) != -1)
				return this.masp

		this.masp = this.audioProcesses.filter(ap => this.subprocesses.includes(ap.pid))?.[0]

		return this.masp
	}

	private get subprocesses(): number[] {
		return execSync(`ps h --ppid ${this.pid} -o pid`)
			.toString()
			.trim()
			.split(/\s+/g)
			.map(s => parseInt(s))
	}

	private get audioProcesses(): SinkInput[] {
		return execSync("pactl list sink-inputs")
			.toString()
			.split(/^Sink Input/gm)
			.filter(s => s)
			.map(s => `Sink Input${s}`.trim().replace(/ +/g, " "))
			.map(s => new SinkInput(s))
	}
}

class SinkInput {
	private readonly description: string

	public constructor(description: string) {
		this.description = description
	}

	public get index(): number {
		return parseInt(this.description.match(/^Sink Input #(\d+)/)[1])
	}

	public get client(): number {
		return parseInt(this.description.match(/Client: (\d+)/)[1])
	}

	public get sink(): number {
		return parseInt(this.description.match(/Sink: (\d+)/)[1])
	}

	public get mute(): "yes" | "no" {
		return this.description.match(/Mute: (yes|no)/)[1] as "yes" | "no"
	}

	public get pid(): number {
		return parseInt(this.description.match(/application.process.id = "(\d+)"/)[1])
	}

	public get volume(): {left: number, right: number, balance: number} {
		let description = this.description

		return new class {
			public get left(): number {
				return parseInt(description.match(/front-left: (\d+) \/ (\d+)%/)[2])
			}

			public get right(): number {
				return parseInt(description.match(/front-right: (\d+) \/ (\d+)%/)[2])
			}

			public get balance(): number {
				return parseFloat(description.match(/balance (\d+.\d+)/)[1])
			}
		}
	}
}