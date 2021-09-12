import { GuildSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ModerationCommand, SetUpModerationCommand } from '#lib/moderation';
import { PermissionFlags } from '#utils/constants';
import { getSecurity } from '#utils/functions';
import { ModerationSetupRestriction } from '#utils/Security/ModerationActions';
import { getImage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import type { ArgumentTypes } from '@sapphire/utilities';

@ApplyOptions<SetUpModerationCommand.Options>({
	aliases: ['um'],
	description: LanguageKeys.Commands.Moderation.UnmuteDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.UnmuteExtended,
	requiredClientPermissions: [PermissionFlags.MANAGE_ROLES],
	roleKey: GuildSettings.Roles.Muted,
	setUpKey: ModerationSetupRestriction.All
})
export class UserSetUpModerationCommand extends SetUpModerationCommand {
	public async handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return getSecurity(message.guild).actions.unMute(
			{
				userId: context.target.id,
				moderatorId: message.author.id,
				reason: context.reason,
				imageURL: getImage(message)
			},
			await this.getTargetDM(message, context.args, context.target)
		);
	}
}
