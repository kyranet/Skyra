const { Event, util: { getContent, getImage }, MessageEmbed, constants: { MESSAGE_LOGS } } = require('../index');

export default class extends Event {

	public async run(message) {
		if (message.command && message.command.deletable) for (const msg of message.responses) msg.nuke();
		if (!message.guild || message.author.id === this.client.user.id) return;

		const { guild } = message;
		if (!guild.settings.events.messageDelete) return;

		this.client.emit('guildMessageLog', message.channel.nsfw ? MESSAGE_LOGS.kNSFWMessage : MESSAGE_LOGS.kMessage, guild, () => new MessageEmbed()
			.setColor(0xFFAB40)
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL())
			.setDescription(message.language.get('EVENTS_MESSAGE_DELETE_MSG', getContent(message) || ''))
			.setFooter(`${message.language.get('EVENTS_MESSAGE_DELETE')} • ${message.channel.name}`)
			.setImage(getImage(message))
			.setTimestamp());
	}

}
