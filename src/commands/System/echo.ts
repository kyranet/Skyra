const { Command } = require('klasa');

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['talk'],
			description: (language) => language.get('COMMAND_ECHO_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_ECHO_EXTENDED'),
			guarded: true,
			permissionLevel: 10,
			usage: '[channel:channel] [message:string] [...]',
			usageDelim: ' '
		});
	}

	public async run(msg, [channel = msg.channel, ...content]) {
		if (msg.deletable) msg.nuke().catch(() => null);

		const attachment = msg.attachments.size ? msg.attachments.first().url : null;
		const mesContent = content.length ? content.join(' ') : '';

		if (!mesContent && !attachment)
			throw 'I have no content nor attachment to send, please write something.';

		const options = {};
		if (attachment) options.files = [{ attachment }];

		await channel.send(mesContent, options);
		if (channel !== msg.channel) await msg.alert(`Message successfully sent to ${channel}`);

		return msg;
	}

}
