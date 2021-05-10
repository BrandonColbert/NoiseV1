type Callback<Events, T extends keyof Events> = (details: Events[T]) => void | Promise<void>
type CallbackFunction = (details: any) => void | Promise<void> 

/**
 * Enables dispatching of events in a category
 */
export default class Dispatcher<Events extends Record<string | number, any>> {
	#callbacks: Map<string, Set<CallbackFunction>>

	/**
	 * @param eventsType Type containing all possible events
	 */
	constructor(eventsType?: Record<string, keyof Events>) {
		this.#callbacks = new Map<string, Set<CallbackFunction>>()

		if(!eventsType)
			return

		this.registerEvent(...Object.keys(eventsType))
	}

	/**
	 * Add an event listener
	 * @param event Event to listen for
	 * @param callback Listener callback
	 * @returns Callback instance
	 */
	on<T extends keyof Events>(event: T, callback: Callback<Events, T>): Callback<Events, T> {
		this.#callbacks.get(event.toString()).add(callback)
		return callback
	}

	/**
	 * Add an event listener that will be removed after its first call
	 * @param event Event to listen for
	 * @param callback Listener callback
	 * @returns Callback instance
	 */
	once<T extends keyof Events>(event: T, callback: Callback<Events, T>): Callback<Events, T> {
		let cb: Callback<Events, T> = null

		cb = details => {
			callback(details)
			this.forget(event, cb)
		}

		this.#callbacks.get(event.toString()).add(cb)
		return cb
	}

	/**
	 * Remove an event listener
	 * @param event Event to stop listening for
	 * @param callback Listener callback
	 */
	forget<T extends keyof Events>(event: T, callback: Callback<Events, T>): void {
		this.#callbacks.get(event.toString()).delete(callback)
	}

	/**
	 * Remove all event listeners
	 */
	forgetAll() {
		for(let [, value] of this.#callbacks)
			value.clear()
	}

	/**
	 * Register a new event type
	 * @param event Event type
	 */
	protected registerEvent<T extends keyof Events>(...event: T[]) {
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
	protected unregisterEvent<T extends keyof Events>(...event: T[]) {
		for(let e of event) {
			if(!this.#callbacks.has(e.toString())) {
				console.error(`Event ${e} is not registered`)
				continue
			}

			this.#callbacks.delete(e.toString())
		}
	}

	/**
	 * Send out a new event
	 * @param event Event type
	 * @param details Event details
	 */
	protected async fire<T extends keyof Events>(event: T, details?: Events[T]): Promise<void> {
		await Promise.all(
			[...this.#callbacks.get(event.toString())]
				.map(callback => callback(details))
		)
	}
}