/**
 * The PreciseTimeout class in charge to perform high-precision promisified and cancellable timeouts
 * @version 1.0.0
 */
export class PreciseTimeout {

	private readonly endsAt: number;
	private stopped = false;
	private resolve: () => void = null;
	private timeout: NodeJS.Timeout = null;

	/**
	 * Create a new PreciseTimeout
	 * @param time The time in milliseconds to run
	 */
	public constructor(time: number) {
		this.endsAt = Date.now() + time;
		this.stopped = false;
		this.resolve = null;
		this.timeout = null;
	}

	/**
	 * Run the timeout
	 */
	public async run(): Promise<boolean> {
		if (this.stopped) return false;

		const cb = () => {
			if (Date.now() + 10 >= this.endsAt) this.stopped = true;
			this.resolve();
			this.resolve = null;
		};

		while (!this.stopped) {
			// tslint:disable-next-line:no-floating-promises
			await new Promise<void>((resolve) => {
				this.resolve = resolve;
				this.timeout = setTimeout(cb, Date.now() - this.endsAt + 10);
			});
		}

		return true;
	}

	/**
	 * Stop the timeout
	 */
	public stop(): boolean {
		if (this.stopped) return false;

		this.stopped = true;
		if (this.timeout) clearTimeout(this.timeout);
		if (this.resolve) this.resolve();
		return true;
	}

}
