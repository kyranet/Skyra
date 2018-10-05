/// <reference path="../../index.d.ts" />
const { Collection } = require('discord.js');
const StarboardMessage = require('./StarboardMessage');

/**
 * The StarboardManager class that manages the starboard channel
 * @since 3.0.0
 * @extends {Collection}
 * @version 4.0.0
 */
// @ts-ignore
module.exports = class StarboardManager extends Collection {

	constructor(guild) {
		super();

		/**
		 * The KlasaClient instance that manages this instance
		 * @since 3.0.0
		 * @type {SKYRA.Skyra}
		 */
		this.client = guild.client;

		/**
		 * The KlasaGuild instance that manages this instance
		 * @since 3.0.0
		 * @type {SKYRA.SkyraGuild}
		 */
		this.guild = guild;
	}

	/**
	 * [LRU-System] Set an entry to the cache. Automatically removes the Least Recently Used.
	 * @since 3.0.0
	 * @param {string} key The key to add
	 * @param {StarboardMessage} value The StarboardMessage to add
	 * @returns {this}
	 */
	set(key, value) {
		if (this.size >= 25) {
			const entry = this.find(sMes => sMes.stars < this.minimum) || this.reduce((acc, sMes) => acc._lastUpdated > sMes._lastUpdated ? sMes : acc, Date.now());
			if (entry) entry.destroy();
		}
		return super.set(key, value);
	}

	/**
	 * Get the Starboard channel
	 * @since 3.0.0
	 * @type {SKYRA.TextChannel}
	 */
	get starboardChannel() {
		const channelID = this.guild.settings.starboard.channel;
		return (channelID && this.guild.channels.get(channelID)) || null;
	}

	/**
	 * Get the minimum amount of stars
	 * @since 3.0.0
	 * @type {number}
	 */
	get minimum() {
		return this.guild.settings.starboard.minimum;
	}

	/**
	 * The provider that manages this starboard
	 * @since 3.0.0
	 * @type {SKYRA.Provider}
	 */
	get provider() {
		return this.client.providers.default;
	}

	/**
	 * Dispose all entries from this Starboard
	 * @since 3.0.0
	 */
	dispose() {
		for (const sMessage of this.values()) sMessage.dispose();
		this.clear();
	}

	/**
	 * Fetch a StarboardMessage entry
	 * @since 3.0.0
	 * @param {SKYRA.SkyraTextChannel} channel The text channel the message was sent
	 * @param {string} messageID The message id
	 * @param {string} userID The user id
	 * @returns {Promise<?StarboardMessage>}
	 */
	async fetch(channel, messageID, userID) {
		const entry = super.get(`${channel.id}-${messageID}`);
		if (entry) return entry;
		const message = await channel.messages.fetch(messageID).catch(() => null);
		if (message) {
			// @ts-ignore
			const starboardMessage = new StarboardMessage(this, message);
			super.set(`${channel.id}-${messageID}`, starboardMessage);
			await starboardMessage.sync();
			if (starboardMessage.users.size) starboardMessage.users.delete(userID);
			return starboardMessage;
		}
		return null;
	}

};
