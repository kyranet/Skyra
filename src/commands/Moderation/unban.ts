import { GuildSettings, readSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ModerationCommand } from '#lib/moderation';
import type { GuildMessage } from '#lib/types';
import { getModeration, getSecurity } from '#utils/functions';
import type { Unlock } from '#utils/moderationConstants';
import { getImage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { resolveKey } from '@sapphire/plugin-i18next';
import type { ArgumentTypes } from '@sapphire/utilities';

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['ub'],
	description: LanguageKeys.Commands.Moderation.UnbanDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.UnbanExtended,
	requiredClientPermissions: ['BAN_MEMBERS'],
	requiredMember: false
})
export class UserModerationCommand extends ModerationCommand {
	public async prehandle(message: GuildMessage) {
		const bans = await message.guild.bans
			.fetch()
			.then((result) => result.map((ban) => ban.user.id))
			.catch(() => null);

		// If the fetch failed, throw an error saying that the fetch failed:
		if (bans === null) {
			throw await resolveKey(message, LanguageKeys.System.FetchBansFail);
		}

		// If there were no bans, throw an error saying that the ban list is empty:
		if (bans.length === 0) {
			throw await resolveKey(message, LanguageKeys.Commands.Moderation.GuildBansEmpty);
		}

		return {
			bans,
			unlock: (await readSettings(message.guild, GuildSettings.Events.BanRemove)) ? getModeration(message.guild).createLock() : null
		};
	}

	public async handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return getSecurity(message.guild).actions.unBan(
			{
				userId: context.target.id,
				moderatorId: message.author.id,
				reason: context.reason,
				imageURL: getImage(message),
				duration: context.duration
			},
			await this.getTargetDM(message, context.args, context.target)
		);
	}

	public posthandle(...[, { preHandled }]: ArgumentTypes<ModerationCommand<Unlock>['posthandle']>) {
		if (preHandled) preHandled.unlock();
	}

	public checkModeratable(...[message, context]: ArgumentTypes<ModerationCommand<Unlock & { bans: string[] }>['checkModeratable']>) {
		if (!context.preHandled.bans.includes(context.target.id)) throw context.args.t(LanguageKeys.Commands.Moderation.GuildBansNotFound);
		return super.checkModeratable(message, context);
	}
}
