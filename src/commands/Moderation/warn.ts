const { ModerationCommand } = require('../../index');

module.exports = class extends ModerationCommand {

	public constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			aliases: ['warning'],
			description: (language) => language.get('COMMAND_WARN_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WARN_EXTENDED'),
			modType: ModerationCommand.types.WARN,
			permissionLevel: 5,
			requiredMember: true
		});
	}

	public handle(msg, user, member, reason) {
		if (reason && msg.guild.settings.messages.warnings) user.send(msg.language.get('COMMAND_WARN_DM', msg.author.tag, msg.guild, reason)).catch(() => null);
		return this.sendModlog(msg, user, reason);
	}

};
