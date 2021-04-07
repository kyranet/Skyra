import { AsyncQueue } from '@sapphire/async-queue';
import { Store } from '@sapphire/pieces';
import { cyan, green, red } from 'colorette';
import { once } from 'events';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { IncomingPayload, NoId, OutgoingPayload, OutgoingType } from './types';
import { WorkerResponseHandler } from './WorkerResponseHandler';

export class WorkerHandler {
	public lastHeartBeat!: number;
	private worker!: Worker;
	private online!: boolean;
	private id = 0;
	private queue = new AsyncQueue();
	private response = new WorkerResponseHandler();

	public constructor() {
		this.spawn();
	}

	/**
	 * The remaining tasks to run in the queue.
	 */
	public get remaining() {
		return this.queue.remaining;
	}

	public async send(data: NoId<IncomingPayload>, delay = 50) {
		await this.queue.wait();

		try {
			const id = this.generateID();
			this.worker.postMessage({ ...data, id });

			const promise = this.response.define(id);
			this.response.timeout(delay);

			return await promise;
		} catch (error) {
			await this.restart();
			throw error;
		} finally {
			this.queue.shift();
		}
	}

	/**
	 * Destroys and restarts the internal worker.
	 */
	public async restart() {
		await this.destroy();
		await this.spawn().start();
	}

	/**
	 * Spawns a new internal worker.
	 * @returns The WorkerHandler instance.
	 */
	public spawn() {
		this.online = false;
		this.lastHeartBeat = 0;
		this.worker = new Worker(WorkerHandler.filename);
		this.worker.on('message', this.handleMessage.bind(this));
		this.worker.once('online', this.handleOnline.bind(this));
		this.worker.once('exit', this.handleExit.bind(this));
		return this;
	}

	/**
	 * Starts the internal worker.
	 */
	public async start() {
		if (!this.online) await once(this.worker, 'online');
	}

	/**
	 * Terminates the internal worker.
	 */
	public async destroy() {
		await this.worker.terminate();
	}

	private generateID() {
		if (this.id === WorkerHandler.maximumID) {
			return (this.id = 0);
		}

		return this.id++;
	}

	private handleMessage(message: OutgoingPayload) {
		if (message.type === OutgoingType.Heartbeat) {
			this.lastHeartBeat = Date.now();
			return;
		}

		this.response.resolve(message.id, message);
	}

	private handleExit(code: number) {
		this.online = false;
		this.worker.removeAllListeners();

		const worker = `[${cyan('WORKER')}]`;
		const thread = cyan(this.worker.threadId.toString(16));
		const exit = code === 0 ? green('0') : red(code.toString());
		Store.injectedContext.logger.info(`${worker} ${thread} exited with code ${exit}`);
	}

	private handleOnline() {
		this.online = true;
	}

	private static filename = join(__dirname, 'worker.js');
	private static maximumID = Number.MAX_SAFE_INTEGER;
}
