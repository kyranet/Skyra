import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { TextChannel } from 'discord.js';
import { PermissionLevels } from '../../../lib/types/Enums';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			cooldown: 10,
			description: language => language.tget('COMMAND_SLOWMODE_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_SLOWMODE_EXTENDED'),
			permissionLevel: PermissionLevels.Administrator,
			requiredPermissions: ['MANAGE_CHANNELS'],
			runIn: ['text'],
			usage: '<reset|cooldown:integer{0,120}>'
		});
	}

	public async run(message: KlasaMessage, [cooldown]: ['reset' | number]) {
		if (cooldown === 'reset') cooldown = 0;
		const channel = message.channel as TextChannel;
		await channel.setRateLimitPerUser(cooldown);
		return message.sendLocale('COMMAND_SLOWMODE_SET', [cooldown]);
	}

}
