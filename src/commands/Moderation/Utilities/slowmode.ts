import { SkyraCommand, SkyraCommandOptions } from '#lib/structures/SkyraCommand';
import { GuildMessage } from '#lib/types/Discord';
import { PermissionLevels } from '#lib/types/Enums';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { Time } from '#utils/constants';
import { ApplyOptions, CreateResolvers } from '@skyra/decorators';
import { TextChannel } from 'discord.js';

const MAXIMUM_TIME = (Time.Hour * 6) / 1000;

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['sm'],
	bucket: 2,
	cooldown: 5,
	cooldownLevel: 'channel',
	description: (language) => language.get(LanguageKeys.Commands.Moderation.SlowmodeDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Moderation.SlowmodeExtended),
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['MANAGE_CHANNELS'],
	runIn: ['text'],
	usage: '<reset|off|seconds:integer|cooldown:cooldown>'
})
@CreateResolvers([
	['cooldown', async (arg, possible, message) => (await message.client.arguments.get('timespan')!.run(arg, possible, message)) / 1000]
])
export default class extends SkyraCommand {
	public async run(message: GuildMessage, [cooldown]: ['reset' | 'off' | number]) {
		if (cooldown === 'reset' || cooldown === 'off' || cooldown < 0) cooldown = 0;
		else if (cooldown > MAXIMUM_TIME) throw await message.fetchLocale(LanguageKeys.Commands.Moderation.SlowmodeTooLong);
		const channel = message.channel as TextChannel;
		await channel.setRateLimitPerUser(cooldown);
		return cooldown === 0
			? message.sendLocale(LanguageKeys.Commands.Moderation.SlowmodeReset)
			: message.sendLocale(LanguageKeys.Commands.Moderation.SlowmodeSet, [{ cooldown: cooldown * 1000 }]);
	}
}
