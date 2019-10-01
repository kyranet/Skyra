import { TextChannel } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: language => language.get('COMMAND_SETIGNORECHANNELS_DESCRIPTION'),
			extendedHelp: language => language.get('COMMAND_SETIGNORECHANNELS_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			usage: '<here|channel:channel>'
		});
	}

	public async run(message: KlasaMessage, [channel]: [TextChannel | 'here']) {
		if (channel === 'here') channel = message.channel as TextChannel;
		else if (channel.type !== 'text') throw message.language.get('CONFIGURATION_TEXTCHANNEL_REQUIRED');
		const oldLength = (message.guild!.settings.get(GuildSettings.Social.IgnoreChannels) as GuildSettings.Social.IgnoreChannels).length;
		await message.guild!.settings.update('master.ignoreChannels', channel);
		const newLength = (message.guild!.settings.get(GuildSettings.Social.IgnoreChannels) as GuildSettings.Social.IgnoreChannels).length;
		return message.sendLocale(oldLength < newLength
			? 'COMMAND_SETIGNORECHANNELS_SET'
			: 'COMMAND_SETIGNORECHANNELS_REMOVED', [channel]);
	}

}
