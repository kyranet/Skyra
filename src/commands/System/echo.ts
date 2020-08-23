import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { MessageOptions, TextChannel } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['talk'],
			description: (language) => language.get('commandEchoDescription'),
			extendedHelp: (language) => language.get('commandEchoExtended'),
			guarded: true,
			permissionLevel: PermissionLevels.BotOwner,
			usage: '[channel:channel] [message:...string]',
			usageDelim: ' '
		});
	}

	public async run(message: KlasaMessage, [channel = message.channel as TextChannel, content]: [TextChannel, string]) {
		if (message.deletable) message.nuke().catch(() => null);

		const attachment = message.attachments.size ? message.attachments.first()!.url : null;

		if (!content.length && !attachment) {
			throw 'I have no content nor attachment to send, please write something.';
		}

		const options: MessageOptions = {};
		if (attachment) options.files = [{ attachment }];

		await channel.send(content, options);
		if (channel !== message.channel) await message.alert(`Message successfully sent to ${channel}`);

		return message;
	}
}
