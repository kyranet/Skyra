const { Command } = require('../../../index');

module.exports = class extends Command {

	public constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SETIGNORECHANNELS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SETIGNORECHANNELS_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			usage: '<here|channel:channel>'
		});
	}

	public async run(msg, [channel]) {
		if (channel === 'here') ({ channel } = msg);
		else if (channel.type !== 'text') throw msg.language.get('CONFIGURATION_TEXTCHANNEL_REQUIRED');
		const oldLength = msg.guild.settings.social.ignoreChannels.length;
		await msg.guild.settings.update('master.ignoreChannels', channel);
		const newLength = msg.guild.settings.social.ignoreChannels.length;
		return msg.sendLocale(oldLength < newLength
			? 'COMMAND_SETIGNORECHANNELS_SET'
			: 'COMMAND_SETIGNORECHANNELS_REMOVED', [channel]);
	}

};
