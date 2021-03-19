import { DbSet } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['darkmode', 'toggledarktheme', 'darktheme'],
	cooldown: 5,
	description: LanguageKeys.Commands.Social.ToggleDarkModeDescription,
	extendedHelp: LanguageKeys.Commands.Social.ToggleDarkModeExtended
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const { users } = await DbSet.connect();
		const updated = await users.lock([message.author.id], async (id) => {
			const user = await users.ensureProfile(id);

			user.profile.darkTheme = !user.profile.darkTheme;
			return user.save();
		});

		return message.send(
			args.t(
				updated.profile.darkTheme ? LanguageKeys.Commands.Social.ToggleDarkModeEnabled : LanguageKeys.Commands.Social.ToggleDarkModeDisabled
			)
		);
	}
}
