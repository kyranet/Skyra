import { getGuildMemberBirthday } from '#lib/birthday';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import type { CommandContext } from '@sapphire/framework';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['viewbday'],
	cooldown: 10,
	description: LanguageKeys.Commands.Misc.ViewBirthdayDescription,
	extendedHelp: LanguageKeys.Commands.Misc.ViewBirthdayExtended,
	runIn: ['text', 'news']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args, context: CommandContext) {
		const user = args.finished ? message.author : await args.pick('userName');
		const task = getGuildMemberBirthday(message.guild.id, user.id);

		return message.send(
			task
				? (args.t(LanguageKeys.Commands.Misc.ViewBirthdaySet, {
						birthDate: task.time.getTime(),
						user: user.toString()
				  }) as string)
				: (args.t(LanguageKeys.Commands.Misc.ViewBirthdayNotSet, { user: user.tag, prefix: context.commandPrefix }) as string),
			{ allowedMentions: { users: [], roles: [] } }
		);
	}
}
