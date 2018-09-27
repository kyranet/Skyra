const { WeebCommand } = require('../../index');

export default class extends WeebCommand {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_WKISS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WKISS_EXTENDED'),
			queryType: 'kiss',
			responseName: 'COMMAND_WKISS',
			usage: '<user:username>'
		});
	}

}
