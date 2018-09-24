const { Command } = require('../../index');

module.exports = class extends Command {

	constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 60,
			description: (language) => language.get('COMMAND_ESCAPEROPE_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_ESCAPEROPE_EXTENDED')
		});
	}

	async run(msg) {
		if (msg.deletable) msg.nuke().catch(() => null);
		return msg.sendLocale('COMMAND_ESCAPEROPE_OUTPUT', [msg.author]);
	}

};
