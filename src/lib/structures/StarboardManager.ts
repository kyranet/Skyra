import { Client, Collection, Guild, TextChannel } from 'discord.js';
import RethinkDB from '../../providers/rethinkdb';
import { GuildSettings } from '../types/settings/GuildSettings';
import { StarboardMessage } from './StarboardMessage';

/**
 * The StarboardManager class that manages the starboard channel
 * @extends {Collection}
 * @version 4.0.0
 */
export class StarboardManager extends Collection<string, StarboardMessage> {

	/**
	 * The Client instance that manages this manager
	 */
	public client: Client;

	/**
	 * The Guild instance that manages this manager
	 */
	public guild: Guild;

	public syncMap: WeakMap<StarboardMessage, Promise<StarboardMessage>> = new WeakMap();

	public constructor(guild: Guild) {
		super();
		this.client = guild.client;
		this.guild = guild;
	}

	/**
	 * [LRU-System] Set an entry to the cache. Automatically removes the Least Recently Used.
	 * @param key The key to add
	 * @param value The StarboardMessage to add
	 */
	public set(key: string, value: StarboardMessage) {
		if (this.size >= 25) {
			const entry = this.find((sMes) => sMes.stars < this.minimum)
				|| this.reduce((acc, sMes) => acc.lastUpdated > sMes.lastUpdated ? sMes : acc, this.first());
			this.delete(entry.message.id);
		}
		return super.set(key, value);
	}

	/**
	 * Get the Starboard channel
	 */
	public get starboardChannel(): TextChannel | null {
		const channelID = this.guild.settings.get(GuildSettings.Starboard.Channel) as GuildSettings.Starboard.Channel;
		return (channelID && this.guild.channels.get(channelID) as TextChannel) || null;
	}

	/**
	 * Get the minimum amount of stars
	 */
	public get minimum(): number {
		return this.guild.settings.get(GuildSettings.Starboard.Minimum) as GuildSettings.Starboard.Minimum;
	}

	/**
	 * The provider that manages this starboard
	 */
	public get provider(): RethinkDB {
		return this.client.providers.default;
	}

	/**
	 * Fetch a StarboardMessage entry
	 * @param channel The text channel the message was sent
	 * @param messageID The message id
	 * @param userID The user id
	 */
	public async fetch(channel: TextChannel, messageID: string, userID: string): Promise<StarboardMessage | null> {
		const entry = super.get(messageID);
		if (entry) return entry;

		const message = await channel.messages.fetch(messageID).catch(() => null);
		if (message) {
			// @ts-ignore
			const starboardMessage = new StarboardMessage(this, message);
			super.set(messageID, starboardMessage);
			await starboardMessage.sync();
			if (starboardMessage.users.size) starboardMessage.users.delete(userID);
			return starboardMessage;
		}

		return null;
	}

}
