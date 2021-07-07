export default abstract class Hierarchy {
	public static findSibling<T extends Element = Element>(
		element: T,
		predicate: (e: T) => boolean,
		{
			direction = "forward",
			selfInclusive = true
		}: SiblingFindOptions = {}
	): T {
		if(!selfInclusive) {
			switch(direction) {
				case "forward":
					element = element?.nextElementSibling as T
					break
				case "backward":
					element = element?.previousElementSibling as T
					break
			}
		}

		if(!element)
			return null

		if(predicate(element))
			return element

		return this.findSibling(element, predicate, {direction: direction, selfInclusive: false})
	}
}

interface SiblingFindOptions {
	direction?: "forward" | "backward"
	selfInclusive?: boolean
}