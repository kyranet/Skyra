export class ResponseError extends Error {
	public readonly result: any;

	public constructor(result: any) {
		super(`Received non-OK response: '${result.status}'`);
		this.result = result;
	}

	public get status(): any {
		return this.result.status;
	}
}
