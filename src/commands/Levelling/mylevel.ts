import { GuildSettings, readSettings, RolesAuto } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Social.MyLevelDescription,
	extendedHelp: LanguageKeys.Commands.Social.MyLevelExtended,
	runIn: ['GUILD_ANY'],
	spam: true
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const user = args.finished ? message.author : await args.pick('userName');

		const { members } = this.container.db;
		const memberSettings = await members.findOne({ where: { userId: user.id, guildId: message.guild.id } });
		const memberPoints = memberSettings?.points ?? 0;
		const roles = await readSettings(message.guild, GuildSettings.Roles.Auto);
		const nextRole = this.getLatestRole(memberPoints, roles);
		const title = nextRole
			? `\n${args.t(LanguageKeys.Commands.Social.MyLevelNext, {
					remaining: nextRole.points - memberPoints,
					next: nextRole.points
			  })}`
			: '';

		return message.send(
			user.id === message.author.id
				? args.t(LanguageKeys.Commands.Social.MyLevelSelf, { points: memberPoints, next: title })
				: args.t(LanguageKeys.Commands.Social.MyLevel, { points: memberPoints, next: title, user: user.username })
		);
	}

	public getLatestRole(points: number, autoroles: readonly RolesAuto[]) {
		for (const autorole of autoroles) {
			if (autorole.points > points) return autorole;
		}

		return null;
	}
}
