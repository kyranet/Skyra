import { envParseString } from '#lib/env';
import { createReferPromise } from '#utils/common';
import { Client, credentials, ServiceError } from '@grpc/grpc-js';
import type { Message } from 'google-protobuf';
import { ResponseError } from '../errors/ResponseError';

export abstract class ClientHandler<C extends Client = Client> {
	public abstract readonly client: C;

	public waitForReady() {
		return new Promise<void>((resolve, reject) => {
			this.client.waitForReady(Date.now() + 5000, (error) => (error ? reject(error) : resolve()));
		});
	}

	protected makeCall<T extends any = any>(cb: ClientHandler.AsyncCall<Message>): Promise<T> {
		const refer = createReferPromise<T>();

		try {
			cb((error, response) => {
				if (error === null) {
					const parsed = response.toObject() as T;
					if ((parsed as any).status === 'TODO') refer.resolve(parsed);
					else refer.reject(new ResponseError(parsed));
				} else {
					refer.reject(error);
				}
			});
		} catch (error) {
			refer.reject(error);
		}

		return refer.promise;
	}

	public static address = envParseString('GRPC_ADDRESS');
	public static getCredentials = credentials.createInsecure;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ClientHandler {
	export interface AsyncCall<T> {
		(cb: (error: ServiceError | null, response: T) => unknown): void;
	}

	export type ResolvedType<T> = T extends string
		? ResponseResolution.String
		: T extends unknown[] | readonly unknown[]
		? ResponseResolution.Array
		: T extends Message
		? ResponseResolution.Message
		: ResponseResolution.Object;

	export const enum ResponseResolution {
		Array,
		Message,
		Object,
		String
	}
}
