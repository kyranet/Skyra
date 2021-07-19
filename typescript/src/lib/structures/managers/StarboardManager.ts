import { GuildSettings, readSettings, StarboardEntity } from '#lib/database';
import type { GuildMessage } from '#lib/types';
import Collection from '@discordjs/collection';
import { Store } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import type { Client, Guild, TextChannel } from 'discord.js';

/**
 * The StarboardManager class that manages the starboard channel
 * @version 4.0.0
 */
export class StarboardManager extends Collection<string, StarboardEntity> {
	/**
	 * The Client instance that manages this manager
	 */
	public client: Client;

	/**
	 * The Guild instance that manages this manager
	 */
	public guild: Guild;

	/**
	 * The synchronization map for [[StarboardManager.fetch]] calls.
	 */
	public syncMap = new Map<string, Promise<StarboardEntity | null>>();

	/**
	 * The synchronization map for [[StarboardEntity.updateStarMessage]] calls.
	 */
	public syncMessageMap = new WeakMap<StarboardEntity, Promise<void>>();

	public constructor(guild: Guild) {
		super();
		this.client = guild.client;
		this.guild = guild;
	}

	/**
	 * [LRU-System] Set an entry to the cache. Automatically removes the Least Recently Used.
	 * @param key The key to add
	 * @param value The StarEntity to add
	 */
	public set(key: string, value: StarboardEntity) {
		if (this.size >= 25) {
			const entry = this.reduce((acc, sMes) => (acc.lastUpdated > sMes.lastUpdated ? sMes : acc), this.first()!);
			this.delete(entry.messageID);
		}
		return super.set(key, value);
	}

	/**
	 * Get the Starboard channel
	 */
	public async getStarboardChannel() {
		const channelID = await readSettings(this.guild, GuildSettings.Starboard.Channel);
		if (isNullish(channelID)) return null;
		return (this.guild.channels.cache.get(channelID) ?? null) as TextChannel | null;
	}

	/**
	 * Get the minimum amount of stars
	 */
	public getMinimumStars() {
		return readSettings(this.guild, GuildSettings.Starboard.Minimum);
	}

	/**
	 * Fetch a StarboardMessage entry
	 * @param channel The text channel the message was sent
	 * @param messageID The message id
	 */
	public async fetch(channel: TextChannel, messageID: string): Promise<StarboardEntity | null> {
		// If a key already exists, return it:
		const entry = super.get(messageID);
		if (entry) return entry;

		// If a key is already synchronising, return the pending promise:
		const previousPending = this.syncMap.get(messageID);
		if (previousPending) return previousPending;

		// Start a new synchronization and return the promise:
		const newPending = this.fetchEntry(channel, messageID).finally(() => this.syncMap.delete(messageID));
		this.syncMap.set(messageID, newPending);
		return newPending;
	}

	private async fetchEntry(channel: TextChannel, messageID: string): Promise<StarboardEntity | null> {
		const message = (await channel.messages.fetch(messageID).catch(() => null)) as GuildMessage | null;
		if (!message) return null;

		const { starboards } = Store.injectedContext.db;
		const previous = await starboards.findOne({ where: { guildID: this.guild.id, messageID } });
		if (previous) {
			previous.init(this, message);
			await previous.downloadStarMessage();
			if (!previous.hasId()) return null;
		}

		const star = previous ?? new StarboardEntity().init(this, message);
		this.set(messageID, star);

		await star.downloadUserList();
		return star.enabled ? star : null;
	}
}
