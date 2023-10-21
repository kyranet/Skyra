import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import type { UserPaginatedMessageCommand as Moderations } from '#root/commands/Moderation/Management/moderations';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum } from '@sapphire/framework';

@ApplyOptions<SkyraCommand.Options>(
	SkyraCommand.PaginatedOptions({
		description: LanguageKeys.Commands.Moderation.WarningsDescription,
		detailedDescription: LanguageKeys.Commands.Moderation.WarningsExtended,
		permissionLevel: PermissionLevels.Moderator,
		runIn: [CommandOptionsRunTypeEnum.GuildAny]
	})
)
export class UserPaginatedMessageCommand extends SkyraCommand {
	public override messageRun(message: GuildMessage, args: SkyraCommand.Args, context: SkyraCommand.RunContext) {
		const moderations = this.store.get('moderations') as Moderations | undefined;
		if (typeof moderations === 'undefined') throw new Error('Moderations command not loaded yet.');
		return moderations.warnings(message, args, context);
	}
}
