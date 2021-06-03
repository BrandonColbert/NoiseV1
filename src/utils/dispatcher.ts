export type Callback<Events, T extends keyof Events> = (details: Events[T]) => any | Promise<any>
export type CallbackFunction = (details: any) => void | Promise<void> 

/**
 * Enables dispatching of events in a category
 */
export default class Dispatcher<Events extends Record<string | number, any>> {
	#callbacks: Map<string, Set<CallbackFunction>>

	/**
	 * @param eventsType Type containing all possible events
	 */
	public constructor(events?: (keyof Events)[]) {
		this.#callbacks = new Map<string, Set<CallbackFunction>>()

		if(!events)
			return

		this.register(...events)
	}

	/**
	 * Send out a new event
	 * @param event Event type
	 * @param details Event details
	 */
	public async fire<T extends keyof Events>(event: T, details?: Events[T]): Promise<void> {
		await Promise.all(
			[...this.#callbacks.get(event.toString())]
				.map(callback => callback(details))
		)
	}

	/**
	 * Add an event listener
	 * @param event Event to listen for
	 * @param callback Listener callback
	 * @returns Callback instance
	 */
	public on<T extends keyof Events>(event: T, callback: Callback<Events, T>): Callback<Events, T> {
		this.#callbacks.get(event.toString()).add(callback)
		return callback
	}

	/**
	 * Add an event listener that will be removed after its first call
	 * @param event Event to listen for
	 * @param callback Listener callback
	 * @returns Callback instance
	 */
	public once<T extends keyof Events>(event: T, callback: Callback<Events, T>): Callback<Events, T> {
		let cb: Callback<Events, T> = null

		cb = details => {
			callback(details)
			this.forget(event, cb)
		}

		return this.on(event, cb)
	}

	/**
	 * Remove an event listener
	 * @param event Event to stop listening for
	 * @param callback Listener callback
	 */
	public forget<T extends keyof Events>(event: T, callback: Callback<Events, T>): void {
		this.#callbacks.get(event.toString()).delete(callback)
	}

	/**
	 * Remove all event listeners
	 */
	public forgetAll() {
		for(let [, value] of this.#callbacks)
			value.clear()
	}

	/**
	 * Register a new event type
	 * @param event Event type
	 */
	protected register<T extends keyof Events>(...event: T[]) {
		for(let e of event) {
			if(this.#callbacks.has(e.toString())) {
				console.error(`Event ${e} is already registered`)
				continue
			}

			this.#callbacks.set(e.toString(), new Set<CallbackFunction>())
		}
	}

	/**
	 * Register an existing event type
	 * @param event Event type
	 */
	protected unregister<T extends keyof Events>(...event: T[]) {
		for(let e of event) {
			if(!this.#callbacks.has(e.toString())) {
				console.error(`Event ${e} is not registered`)
				continue
			}

			this.#callbacks.delete(e.toString())
		}
	}
}