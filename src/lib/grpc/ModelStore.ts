import { envParseBoolean } from '#lib/env';

export class ModelStore {
	public start() {
		if (!envParseBoolean('GRPC_ENABLED')) return this.destroy();
	}

	public destroy() {
		// TODO: Implement GRPC
	}
}
