import {v4 as uuidv4} from "uuid"

export default class Generate {
	/**
	 * @returns A v4 UUID
	 */
	public static uuid(): string {
		return uuidv4()
	}

	/**
	 * @param lower Lower bound
	 * @param upper Upper bound
	 * @returns A random number in the given range
	 */
	public static range(lower: number, upper: number): number

	/**
	 * @param upper Upper bound
	 * @returns A random number between 0 and the upper bound
	 */
	public static range(upper: number): number

	/**
	 * @returns A random number between 0 and 1
	 */
	public static range(): number

	public static range(par1?: number, par2?: number): number {
		if(par2) {
			let lower = par1
			let upper = par2

			return lower + Math.random() * (upper - lower)
		} else if(par1) {
			let upper = par1

			return upper * Math.random()
		} else
			return Math.random()
	}
}