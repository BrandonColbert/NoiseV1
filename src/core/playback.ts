/**
 * Contains information about the playback state of a playlist
 */
export default abstract class Playback {
	protected itemIndex: number

	public constructor() {
		this.itemIndex = -1
	}

	public get started(): boolean {
		return this.itemIndex >= 0
	}

	public get mediaItemIndex(): number {
		return Math.max(0, this.itemIndex)
	}

	/**
	 * Reset playlist progress
	 */
	public async reset(): Promise<void> {
		this.itemIndex = -1
	}

	/**
	 * Play the next item
	 */
	public async playNext(): Promise<void> {
		await this.play(this.itemIndex + 1)
	}

	/**
	 * Play the previous item
	 */
	public async playPrevious(): Promise<void> {
		await this.play(this.itemIndex - 1)
	}

	/**
	 * Play the item at the index
	 * @param index Item index
	 */
	public abstract play(index: number): Promise<void>
}