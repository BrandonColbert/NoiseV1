/**
 * Creates object copies
 */
export default class Replicate {
	/**
	 * @returns Shallow copy of the target
	 */
	static copy<T extends object>(target: T): T {
		if(Object.getPrototypeOf(target) != Object.prototype)
			throw `${target.constructor.name} is not an object literal`

		return {...target}
	}

	/**
	 * @returns Deep copy of the target
	 */
	static clone<T extends object>(target: T): T {
		return JSON.parse(JSON.stringify(target))
	}
}