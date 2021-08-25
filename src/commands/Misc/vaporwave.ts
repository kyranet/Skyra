import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import type { Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Misc.VaporwaveDescription,
	extendedHelp: LanguageKeys.Commands.Misc.VaporwaveExtended,
	spam: true
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const input = await args.rest('string');

		let output = '';
		for (let i = 0; i < input.length; i++) output += input[i] === ' ' ? ' ' : String.fromCharCode(input.charCodeAt(i) + 0xfee0);

		const content = args.t(LanguageKeys.Commands.Misc.VaporwaveOutput, { str: output });
		return send(message, { content, allowedMentions: { users: [], roles: [] } });
	}
}
