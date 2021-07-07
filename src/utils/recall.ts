/**
 * Records action to enable undo/redo functionality
 */
export class Recall {
	private history: Recall.Action[] = []
	private index: number = -1

	/**
	 * Record an action that may be undone later
	 * @param action Action to record
	 */
	public record(action: Recall.Action): void {
		this.history.length = this.index + 1
		++this.index

		this.history.push(action)
	}

	/**
	 * Forget all actions
	 */
	public forget(): void {
		this.history.length = 0
		this.index = -1
	}

	/**
	 * Regress the action chain
	 * @returns The reversed action or null if regression was not possible
	 */
	public undo(): Recall.Action {
		if(this.index == -1)
			return null

		let action = this.history[this.index]
		action.reverse()

		this.index = Math.max(-1, this.index - 1)

		return action
	}

	/**
	 * Progress the action chain
	 * @returns The executed action or null if progression was not possible
	 */
	public redo(): Recall.Action {
		if(this.index == this.history.length - 1)
			return null

		this.index = Math.min(this.index + 1, this.history.length - 1)

		let action = this.history[this.index]
		action.execute()

		return action
	}
}

export namespace Recall {
	/**
	 * A single action that may be reversed
	 */
	export abstract class Action {
		/**
		 * Apply the effects of this action
		 */
		public abstract execute(): void

		/**
		 * Reverse the effects of this action
		 */
		public abstract reverse(): void
	}
}

export default Recall