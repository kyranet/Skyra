import { rootFolder } from '#utils/constants';
import Collection from '@discordjs/collection';
import { readFileSync } from 'fs';
import type { KeyType, Redis } from 'ioredis';
import { resolve } from 'path';
import { Queue } from './Queue.js';
import type { QueueClient } from './QueueClient.js';

interface RedisCommand {
	name: string;
	keys: number;
}

const commands: RedisCommand[] = [
	{
		name: 'lmove',
		keys: 1
	},
	{
		name: 'lremat',
		keys: 1
	},
	{
		name: 'lshuffle',
		keys: 1
	},
	{
		name: 'rpopset',
		keys: 2
	}
];

export interface ExtendedRedis extends Redis {
	lmove: (key: KeyType, from: number, to: number) => Promise<'OK'>;
	lremat: (key: KeyType, index: number) => Promise<'OK'>;
	lshuffle: (key: KeyType, seed: number) => Promise<'OK'>;
	rpopset: (source: KeyType, destination: KeyType) => Promise<string | null>;
}

export class QueueStore extends Collection<string, Queue> {
	public redis: ExtendedRedis;

	public constructor(public readonly client: QueueClient, redis: Redis) {
		super();

		this.redis = redis as any;

		for (const command of commands) {
			this.redis.defineCommand(command.name, {
				numberOfKeys: command.keys,
				lua: readFileSync(resolve(rootFolder, 'scripts', 'audio', `${command.name}.lua`)).toString()
			});
		}
	}

	public get(key: string): Queue {
		let queue = super.get(key);
		if (!queue) {
			queue = new Queue(this, key);
			this.set(key, queue);
		}

		return queue;
	}

	public async start() {
		const guilds = await this.getPlayingEntries();
		await Promise.all(guilds.map((guild) => this.get(guild).start()));
	}

	private async getPlayingEntries(): Promise<string[]> {
		const guilds = new Set<string>();

		let cursor = '0';
		do {
			// `scan` returns a tuple with the next cursor (which must be used for the
			// next iteration) and an array of the matching keys. The iterations end when
			// cursor becomes '0' again.
			const response = await this.redis.scan(cursor, 'MATCH', 'skyra.a.*.p');
			[cursor] = response;

			for (const key of response[1]) {
				// Slice 'skyra.a.' from the start, and '.p' from the end:
				const id = key.slice(8, -2);
				guilds.add(id);
			}
		} while (cursor !== '0');

		return [...guilds];
	}
}
