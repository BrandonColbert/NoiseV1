type Styles = Record<string, any>

/**
 * Styles an HTML element using a style list
 */
export default class Stylist {
	/**
	 * Add a style from a style list to an element
	 * @param target Element to style
	 * @param styles Style list
	 * @param key Key to the style
	 */
	static add<U extends Styles, V extends keyof U>(target: Element, styles: U, ...key: V[]): void {
		for(let k of key) {
			if(typeof k != "string")
				throw `Attempted to use ${k} of type ${typeof k} for styling`

			if(!styles.hasOwnProperty(k))
				continue

			target.classList.add(styles[k])
		}
	}

	/**
	 * Removes a style from an element
	 * @param target Element to remove style from
	 * @param styles Style list
	 * @param key Key to the style
	 */
	static remove<U extends Styles, V extends keyof U>(target: Element, styles: U, ...key: V[]): void {
		for(let k of key) {
			if(typeof k != "string")
				throw `Attempted to use ${k} of type ${typeof k} for styling`

			if(!styles.hasOwnProperty(k))
				continue
			
			target.classList.remove(styles[k])
		}
	}
}