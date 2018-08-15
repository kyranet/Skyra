const { Command } = require('../../../index');

module.exports = class extends Command {

	constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SETROLECHANNEL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SETROLECHANNEL_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			usage: '<here|channel:channel>'
		});
	}

	async run(msg, [channel]) {
		if (channel === 'here') ({ channel } = msg);
		else if (channel.type !== 'text') throw msg.language.get('CONFIGURATION_TEXTCHANNEL_REQUIRED');
		if (msg.guild.settings.channels.roles === channel.id) throw msg.language.get('CONFIGURATION_EQUALS');
		await msg.guild.settings.update([['channels.roles', channel], ['roles.messageReaction', null]]);
		return msg.sendLocale('COMMAND_SETROLECHANNEL_SET', [channel]);
	}

};
