import { ModerationCommand, ModerationCommandOptions } from '@lib/structures/ModerationCommand';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { ApplyOptions } from '@skyra/decorators';
import { Moderation } from '@utils/constants';
import { ArgumentTypes, getImage } from '@utils/util';
import { KlasaMessage } from 'klasa';

@ApplyOptions<ModerationCommandOptions>({
	aliases: ['ub'],
	description: (language) => language.get('COMMAND_UNBAN_DESCRIPTION'),
	extendedHelp: (language) => language.get('COMMAND_UNBAN_EXTENDED'),
	requiredMember: false,
	requiredPermissions: ['BAN_MEMBERS']
})
export default class extends ModerationCommand {
	public async prehandle(message: KlasaMessage) {
		const bans = await message
			.guild!.fetchBans()
			.then((result) => result.map((ban) => ban.user.id))
			.catch(() => {
				throw message.language.get('SYSTEM_FETCHBANS_FAIL');
			});
		if (bans.length)
			return { bans, unlock: message.guild!.settings.get(GuildSettings.Events.BanRemove) ? message.guild!.moderation.createLock() : null };
		throw message.language.get('GUILD_BANS_EMPTY');
	}

	public async handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return message.guild!.security.actions.unBan(
			{
				userID: context.target.id,
				moderatorID: message.author.id,
				reason: context.reason,
				imageURL: getImage(message),
				duration: context.duration
			},
			await this.getTargetDM(message, context.target)
		);
	}

	public posthandle(...[, { preHandled }]: ArgumentTypes<ModerationCommand<Moderation.Unlock>['posthandle']>) {
		if (preHandled) preHandled.unlock();
	}

	public checkModeratable(
		...[message, { preHandled, target, ...context }]: ArgumentTypes<ModerationCommand<Moderation.Unlock & { bans: string[] }>['checkModeratable']>
	) {
		if (!preHandled.bans.includes(target.id)) throw message.language.get('GUILD_BANS_NOT_FOUND');
		return super.checkModeratable(message, { preHandled, target, ...context });
	}
}
