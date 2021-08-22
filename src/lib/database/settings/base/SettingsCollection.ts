import { Collection } from '@discordjs/collection';
import { RWLock } from 'async-rwlock';
import type { Client } from 'discord.js';
import type { IBaseEntity } from './IBaseEntity';

export interface SettingsCollectionCallback<T extends IBaseEntity, R> {
	(entity: T): Promise<R> | R;
}

export abstract class SettingsCollection<T extends IBaseEntity> extends Collection<string, T> {
	public readonly client: Client;
	private readonly queue = new Map<string, Promise<T>>();
	private readonly locks = new Map<string, RWLock>();

	public constructor(client: Client) {
		super();
		this.client = client;
	}

	public delete(key: string) {
		this.locks.delete(key);
		return super.delete(key);
	}

	public read<K1 extends keyof T>(key: string, paths: readonly [K1]): Promise<[T[K1]]>;
	public read<K1 extends keyof T, K2 extends keyof T>(key: string, paths: readonly [K1, K2]): Promise<[T[K1], T[K2]]>;
	public read<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T>(
		key: string,
		paths: readonly [K1, K2, K3]
	): Promise<[T[K1], T[K2], T[K3]]>;

	public read<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T>(
		key: string,
		paths: readonly [K1, K2, K3, K4]
	): Promise<[T[K1], T[K2], T[K3], T[K4]]>;

	public read<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T>(
		key: string,
		paths: readonly [K1, K2, K3, K4, K5]
	): Promise<[T[K1], T[K2], T[K3], T[K4], T[K5]]>;

	public read<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T>(
		key: string,
		paths: readonly [K1, K2, K3, K4, K5, K6]
	): Promise<[T[K1], T[K2], T[K3], T[K4], T[K5], T[K6]]>;

	public read<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T
	>(key: string, paths: readonly [K1, K2, K3, K4, K5, K6, K7]): Promise<[T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7]]>;

	public read<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T,
		K8 extends keyof T
	>(key: string, paths: readonly [K1, K2, K3, K4, K5, K6, K7, K8]): Promise<[T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8]]>;

	public read<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T,
		K8 extends keyof T,
		K9 extends keyof T
	>(key: string, paths: readonly [K1, K2, K3, K4, K5, K6, K7, K8, K9]): Promise<[T[K1], T[K2], T[K3], T[K4], T[K5], T[K6], T[K7], T[K8], T[K9]]>;

	public read<K extends keyof T>(key: string, paths: readonly K[]): Promise<T[K][]>;
	public read<K extends keyof T>(key: string, path: K): Promise<T[K]>;
	public read<R>(key: string, cb: SettingsCollectionCallback<T, R>): Promise<R>;
	public read(key: string): Promise<T>;
	public async read<R>(key: string, cb?: keyof T | readonly (keyof T)[] | SettingsCollectionCallback<T, R>): Promise<any> {
		const lock = this.acquireLock(key);
		try {
			// Acquire a read lock:
			await lock.readLock();

			// Fetch the entry:
			const settings = this.get(key) ?? (await this.processFetch(key));

			if (typeof cb === 'undefined') {
				return settings;
			}

			// If a callback was given, call it:
			if (typeof cb === 'function') {
				return await cb(settings);
			}

			// If an array of keys was given, map all values:
			if (Array.isArray(cb)) {
				return cb.map((k: keyof T) => settings[k]);
			}

			// Else, retrieve the single value:
			return settings[cb as keyof T];
		} finally {
			// Unlock the lock:
			lock.unlock();
		}
	}

	public write<K1 extends keyof T>(key: string, pairs: readonly [[K1, T[K1]]]): Promise<void>;
	public write<K1 extends keyof T, K2 extends keyof T>(key: string, pairs: readonly [[K1, T[K1]], [K2, T[K2]]]): Promise<void>;
	public write<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]]]
	): Promise<void>;

	public write<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]]]
	): Promise<void>;

	public write<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]], [K5, T[K5]]]
	): Promise<void>;

	public write<K1 extends keyof T, K2 extends keyof T, K3 extends keyof T, K4 extends keyof T, K5 extends keyof T, K6 extends keyof T>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]], [K5, T[K5]], [K6, T[K6]]]
	): Promise<void>;

	public write<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T
	>(key: string, pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]], [K5, T[K5]], [K6, T[K6]], [K7, T[K7]]]): Promise<void>;

	public write<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T,
		K8 extends keyof T
	>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]], [K5, T[K5]], [K6, T[K6]], [K7, T[K7]], [K8, T[K8]]]
	): Promise<void>;

	public write<
		K1 extends keyof T,
		K2 extends keyof T,
		K3 extends keyof T,
		K4 extends keyof T,
		K5 extends keyof T,
		K6 extends keyof T,
		K7 extends keyof T,
		K8 extends keyof T,
		K9 extends keyof T
	>(
		key: string,
		pairs: readonly [[K1, T[K1]], [K2, T[K2]], [K3, T[K3]], [K4, T[K4]], [K5, T[K5]], [K6, T[K6]], [K7, T[K7]], [K8, T[K8]], [K9, T[K9]]]
	): Promise<void>;

	public write<K extends keyof T>(key: string, pairs: readonly [K, T[K]][]): Promise<void>;
	public write<R>(key: string, cb: SettingsCollectionCallback<T, R>): Promise<R>;
	public async write<R>(key: string, cb: readonly [keyof T, T[keyof T]][] | SettingsCollectionCallback<T, R>): Promise<any> {
		const lock = this.acquireLock(key);

		// Acquire a write lock:
		await lock.writeLock();

		// Fetch the entry:
		const settings = this.get(key) ?? (await this.unlockOnThrow(this.processFetch(key), lock));

		try {
			// If a callback was given, call it, receive its return, save the settings, and return:
			if (typeof cb === 'function') {
				const result = await cb(settings);
				await settings.save();
				return result;
			}

			// Otherwise, for each key, we set the value:
			for (const [k, v] of cb) {
				settings[k] = v;
			}

			// Now we save, and return undefined:
			await settings.save();
			return undefined;
		} catch (error) {
			await this.tryReload(settings);
			throw error;
		} finally {
			lock.unlock();
		}
	}

	public abstract fetch(key: string): Promise<T>;

	private async tryReload(entity: T): Promise<void> {
		try {
			await entity.reload();
		} catch (error) {
			if (error instanceof Error && error.name === 'EntityNotFound') entity.resetAll();
			else throw error;
		}
	}

	private async unlockOnThrow(promise: Promise<T>, lock: RWLock) {
		try {
			return await promise;
		} catch (error) {
			lock.unlock();
			throw error;
		}
	}

	private async processFetch(key: string): Promise<T> {
		const previous = this.queue.get(key);
		if (previous) return previous;

		try {
			const promise = this.fetch(key);
			this.queue.set(key, promise);
			return await promise;
		} finally {
			this.queue.delete(key);
		}
	}

	private acquireLock(key: string): RWLock {
		const previous = this.locks.get(key);
		if (previous) return previous;

		const lock = new RWLock();
		this.locks.set(key, lock);
		return lock;
	}
}
