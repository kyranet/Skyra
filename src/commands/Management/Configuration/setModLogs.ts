import { TextChannel } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SETMODLOGS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SETMODLOGS_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			usage: '<here|channel:channel>'
		});
	}

	public async run(message: KlasaMessage, [channel]: [TextChannel | 'here']) {
		if (channel === 'here') channel = message.channel as TextChannel;
		else if (channel.type !== 'text') throw message.language.get('CONFIGURATION_TEXTCHANNEL_REQUIRED');
		if (message.guild.settings.get(GuildSettings.Channels.ModerationLogs) === channel.id) throw message.language.get('CONFIGURATION_EQUALS');
		await message.guild.settings.update(GuildSettings.Channels.ModerationLogs, channel);
		return message.sendLocale('COMMAND_SETMODLOGS_SET', [channel]);
	}

}
