/**
 * Text formatting utilities
 */
export default class Format {
	static simplify(value: string): string {
		return value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
	}
}