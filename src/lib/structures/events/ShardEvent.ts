import { bold, magenta } from 'colorette';
import { Event } from 'klasa';

export abstract class ShardEvent extends Event {
	protected abstract readonly title: string;

	protected header(shardID: number): string {
		return `${bold(magenta(`[SHARD ${shardID}]`))} ${this.title}`;
	}
}
