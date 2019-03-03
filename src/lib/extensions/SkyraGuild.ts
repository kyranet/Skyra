import { Collection, Structures } from 'discord.js';
import { KlasaGuild } from 'klasa';
import { enumerable } from '../util/util';

import { ModerationManager } from '../structures/ModerationManager';
import { Queue } from '../structures/music/Queue';
import { StarboardManager } from '../structures/StarboardManager';
import { GuildSecurity } from '../util/Security/GuildSecurity';

export class SkyraGuild extends KlasaGuild {
	public security = new GuildSecurity(this);
	public starboard = new StarboardManager(this);
	public moderation = new ModerationManager(this);
	public music = new Queue(this);

	@enumerable(false)
	public memberSnowflakes: Set<string> = new Set();

	public get memberTags() {
		const collection = new Collection<string, string>();
		for (const snowflake of this.memberSnowflakes) {
			// @ts-ignore
			const username = this.client.usertags.get(snowflake);
			if (username) collection.set(snowflake, username);
		}
		return collection;
	}

	public get memberUsernames() {
		const collection = new Collection<string, string>();
		for (const snowflake of this.memberSnowflakes) {
			// @ts-ignore
			const username = this.client.usertags.get(snowflake);
			if (username) collection.set(snowflake, username.slice(0, username.indexOf('#')));
		}
		return collection;
	}

}

declare module 'discord.js' {
	export interface Guild {
		security: GuildSecurity;
		starboard: StarboardManager;
		moderation: ModerationManager;
		music: Queue;
		memberSnowflakes: Set<string>;
		memberTags: Collection<string, string>;
		memberUsernames: Collection<string, string>;
	}
}

Structures.extend('Guild', () => SkyraGuild);
