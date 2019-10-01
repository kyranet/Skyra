import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.get('COMMAND_DONATE_DESCRIPTION'),
			extendedHelp: language => language.get('COMMAND_DONATE_EXTENDED'),
			guarded: true
		});
	}

	public async run(message: KlasaMessage) {
		try {
			const response = await message.author!.send(message.language.get('COMMAND_DONATE_EXTENDED'));
			return message.channel.type === 'dm' ? message.alert(message.language.get('COMMAND_DM_SENT')) : response;
		} catch {
			return message.channel.type === 'dm' ? null : message.alert(message.language.get('COMMAND_DM_NOT_SENT'));
		}
	}

}
