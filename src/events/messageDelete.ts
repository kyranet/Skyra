import { MessageEmbed, TextChannel } from 'discord.js';
import { Event, KlasaMessage } from 'klasa';
import { Events } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { MessageLogsEnum } from '@util/constants';
import { cutText, getContent, getImage } from '@util/util';

export default class extends Event {

	public run(message: KlasaMessage) {
		if (message.partial || !message.guild || message.author.bot) return;

		this.handleMessageLogs(message);
		this.handleSnipeMessage(message);
	}

	private handleMessageLogs(message: KlasaMessage) {
		const enabled = message.guild!.settings.get(GuildSettings.Events.MessageDelete);
		const ignoreChannels = message.guild!.settings.get(GuildSettings.Messages.IgnoreChannels);
		if (!enabled || ignoreChannels.includes(message.channel.id)) return;

		const channel = message.channel as TextChannel;
		this.client.emit(Events.GuildMessageLog, channel.nsfw ? MessageLogsEnum.NSFWMessage : MessageLogsEnum.Message, message.guild, () => new MessageEmbed()
			.setColor(0xFFAB40)
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL())
			.setDescription(cutText(getContent(message) || '', 1900))
			.setFooter(`${message.language.tget('EVENTS_MESSAGE_DELETE')} • ${channel.name}`)
			.setImage(getImage(message)!)
			.setTimestamp());
	}

	private handleSnipeMessage(message: KlasaMessage) {
		if (message.channel instanceof TextChannel) message.channel.sniped = message;
	}

}
