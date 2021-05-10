/**
 * Describes the process of extracting candidates from a page
 */
export default interface Pipe {
	/**
	 * What the pipe is used for
	 */
	type: Type

	/**
	 * Value to operate on the input with
	 */
	value?: string

	/**
	 * Pipes to send this pipe's output into
	 */
	pipes?: Pipe[]
}

/**
 * Types of pipes that can exist
 */
export type Type =
	"request" |
	"content" |
	"url" |
	"title" |
	"uri" |
	"format" |
	"selector" |
	"selectorAll" |
	"property" |
	"regex"

/**
 * @param pipe Pipe being fed
 * @param type Input pipe type
 * @param values Input values
 * @returns Output of the fed pipe
 */
export function feed(pipe: Pipe, type: Type, values: any[]): any[] {
	switch(pipe.type) {
		case "uri":
			return values.map((e: string) => encodeURI(e))
		case "format":
			return values.map((e: string) => pipe.value.replace("{}", e))
		case "selector":
			return values.map((e: HTMLElement) => e.querySelector(pipe.value))
		case "selectorAll":
			return values.map((e: HTMLElement) => Array.from(e.querySelectorAll(pipe.value))).flat()
		case "property":
			return values.map((e: {[key in string]: object}) => e[pipe.value])
		case "regex":
			return values.map((e: string) => {
				let matches = e.match(new RegExp(pipe.value, "g"))
				return matches.length > 0 ? matches[0] : ""
			})
		default:
			return values
	}
}