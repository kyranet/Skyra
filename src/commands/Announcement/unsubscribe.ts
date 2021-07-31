import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { announcementCheck } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Announcement.UnsubscribeDescription,
	extendedHelp: LanguageKeys.Commands.Announcement.UnsubscribeExtended,
	requiredClientPermissions: ['MANAGE_ROLES'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const role = await announcementCheck(message);
		await message.member.roles.remove(role);
		return send(message, args.t(LanguageKeys.Commands.Announcement.UnsubscribeSuccess, { role: role.name }));
	}
}
