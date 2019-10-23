import { TextChannel } from 'discord.js';
import { CommandOptions, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';
import { ApplyOptions } from '../../../lib/util/util';

@ApplyOptions<CommandOptions>({
	bucket: 2,
	cooldown: 10,
	description: language => language.tget('COMMAND_SETMEMBERLOGS_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_SETMEMBERLOGS_EXTENDED'),
	permissionLevel: 6,
	runIn: ['text'],
	usage: '<here|channel:channel>'
})
export default class extends SkyraCommand {

	public async run(message: KlasaMessage, [channel]: [TextChannel | 'here']) {
		if (channel === 'here') channel = message.channel as TextChannel;
		else if (channel.type !== 'text') throw message.language.tget('CONFIGURATION_TEXTCHANNEL_REQUIRED');

		const previous = message.guild!.settings.get(GuildSettings.Channels.MemberLogs);
		if (previous === channel.id) throw message.language.tget('CONFIGURATION_EQUALS');
		await message.guild!.settings.update(GuildSettings.Channels.MemberLogs, channel);
		return message.sendLocale('COMMAND_SETMEMBERLOGS_SET', [channel]);
	}

}
