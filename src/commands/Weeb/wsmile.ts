import { WeebCommand } from '@lib/structures/WeebCommand';
import { CommandStore } from 'klasa';

export default class extends WeebCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: (language) => language.tget('COMMAND_WSMILE_DESCRIPTION'),
			extendedHelp: (language) => language.tget('COMMAND_WSMILE_EXTENDED'),
			queryType: 'smile',
			responseName: 'COMMAND_WSMILE'
		});
	}
}
