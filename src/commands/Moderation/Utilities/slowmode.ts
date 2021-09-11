import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types/Discord';
import { PermissionLevels } from '#lib/types/Enums';
import { hours } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { TextChannel } from 'discord.js';

const MAXIMUM_DURATION = hours(6);

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['sm'],
	description: LanguageKeys.Commands.Moderation.SlowmodeDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.SlowmodeExtended,
	permissionLevel: PermissionLevels.Moderator,
	requiredClientPermissions: ['MANAGE_CHANNELS'],
	runIn: ['GUILD_TEXT']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const cooldown = await args
			.pick('reset')
			.then(() => 0)
			.catch(() => args.rest('timespan', { minimum: 0, maximum: MAXIMUM_DURATION }));

		const channel = message.channel as TextChannel;
		await channel.setRateLimitPerUser(cooldown / 1000);

		const content =
			cooldown === 0
				? args.t(LanguageKeys.Commands.Moderation.SlowmodeReset)
				: args.t(LanguageKeys.Commands.Moderation.SlowmodeSet, { cooldown });

		return send(message, content);
	}
}
