import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@skyra/editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['bot-info'],
	description: LanguageKeys.Commands.General.InfoDescription,
	extendedHelp: LanguageKeys.Commands.General.InfoExtended
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const content = args.t(LanguageKeys.Commands.General.InfoBody);
		return send(message, content);
	}
}
