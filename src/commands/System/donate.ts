import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: (language) => language.get(LanguageKeys.Commands.System.DonateDescription),
			extendedHelp: (language) => language.get(LanguageKeys.Commands.System.DonateExtended),
			guarded: true
		});
	}

	public async run(message: KlasaMessage) {
		try {
			// TODO: This is not formatted
			const response = await message.author.sendLocale(LanguageKeys.Commands.System.DonateExtended);
			return message.channel.type === 'dm' ? await message.alert(message.language.get(LanguageKeys.Commands.System.DmSent)) : response;
		} catch {
			return message.channel.type === 'dm' ? null : message.alert(message.language.get(LanguageKeys.Commands.System.DmNotSent));
		}
	}
}
