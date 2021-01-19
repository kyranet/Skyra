import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['details', 'what'],
	cooldown: 5,
	description: LanguageKeys.Commands.General.InfoDescription,
	extendedHelp: LanguageKeys.Commands.General.InfoExtended,
	guarded: true
})
export default class extends SkyraCommand {
	public async run(message: Message) {
		return message.send(await message.resolveKey(LanguageKeys.Commands.General.InfoBody));
	}
}
