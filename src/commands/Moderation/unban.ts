import { GuildSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ModerationCommand } from '#lib/moderation';
import type { GuildMessage } from '#lib/types';
import { Moderation } from '#utils/constants';
import { getImage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import type { ArgumentTypes } from '@sapphire/utilities';

@ApplyOptions<ModerationCommand.Options>({
	aliases: ['ub'],
	description: LanguageKeys.Commands.Moderation.UnbanDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.UnbanExtended,
	requiredMember: false,
	permissions: ['BAN_MEMBERS']
})
export class UserModerationCommand extends ModerationCommand {
	public async prehandle(message: GuildMessage) {
		const bans = await message.guild
			.fetchBans()
			.then((result) => result.map((ban) => ban.user.id))
			.catch(() => null);

		// If the fetch failed, throw an error saying that the fetch failed:
		if (bans === null) {
			throw await message.resolveKey(LanguageKeys.System.FetchBansFail);
		}

		// If there were no bans, throw an error saying that the ban list is empty:
		if (bans.length === 0) {
			throw await message.resolveKey(LanguageKeys.Commands.Moderation.GuildBansEmpty);
		}

		return {
			bans,
			unlock: (await message.guild.readSettings(GuildSettings.Events.BanRemove)) ? message.guild.moderation.createLock() : null
		};
	}

	public async handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return message.guild.security.actions.unBan(
			{
				userID: context.target.id,
				moderatorID: message.author.id,
				reason: context.reason,
				imageURL: getImage(message),
				duration: context.duration
			},
			await this.getTargetDM(message, context.args, context.target)
		);
	}

	public posthandle(...[, { preHandled }]: ArgumentTypes<ModerationCommand<Moderation.Unlock>['posthandle']>) {
		if (preHandled) preHandled.unlock();
	}

	public checkModeratable(...[message, context]: ArgumentTypes<ModerationCommand<Moderation.Unlock & { bans: string[] }>['checkModeratable']>) {
		if (!context.preHandled.bans.includes(context.target.id)) throw context.args.t(LanguageKeys.Commands.Moderation.GuildBansNotFound);
		return super.checkModeratable(message, context);
	}
}
