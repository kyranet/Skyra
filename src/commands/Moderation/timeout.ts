import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ModerationCommand } from '#lib/moderation';
import { days, seconds } from '#utils/common';
import { TypeVariation } from '#utils/moderationConstants';
import { ApplyOptions } from '@sapphire/decorators';
import { PermissionFlagsBits } from 'discord.js';

type Type = TypeVariation.Timeout;
type ValueType = null;

@ApplyOptions<ModerationCommand.Options<Type>>({
	description: LanguageKeys.Commands.Moderation.TimeoutApplyDescription,
	detailedDescription: LanguageKeys.Commands.Moderation.TimeoutApplyExtended,
	requiredClientPermissions: [PermissionFlagsBits.ModerateMembers],
	minimumDuration: seconds(5),
	maximumDuration: days(28),
	requiredMember: true,
	requiredDuration: true,
	type: TypeVariation.Timeout
})
export class UserModerationCommand extends ModerationCommand<Type, ValueType> {}
