const { RawEvent, util: { resolveEmoji } } = require('../index');

export default class extends RawEvent {

	public constructor(client: Skyra, store: RawEventStore, file: string[], directory: string) {
		super(client, store, file, directory, { name: 'MESSAGE_REACTION_REMOVE' });
	}

	// 	{ user_id: 'id',
	// 	  message_id: 'id',
	// 	  emoji: { name: '😄', id: null, animated: false },
	// 	  channel_id: 'id' }

	public async process({ user_id, channel_id, message_id, emoji }) { // eslint-disable-line camelcase
		// Verify channel
		const channel = this.client.channels.get(channel_id);
		if (!channel || channel.type !== 'text' || !channel.readable) return false;

		if (channel.id === channel.guild.settings.channels.roles)
			this._handleRoleChannel(channel.guild, emoji, user_id, message_id);

		return false;
	}

	public async _handleRoleChannel(guild, emoji, userID, messageID) {
		const { messageReaction } = guild.settings.roles;
		if (!messageReaction || messageReaction !== messageID) return;

		const parsed = resolveEmoji(emoji.id ? `${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}` : emoji.name);
		const roleEntry = guild.settings.roles.reactions.find((entry) => entry.emoji === parsed);
		if (!roleEntry) return;

		try {
			const member = await guild.members.fetch(userID);
			if (!member.roles.has(roleEntry.role)) return;
			await member.roles.remove(roleEntry.role);
		} catch (error) {
			this.client.emit('apiError', error);
		}
	}

}
