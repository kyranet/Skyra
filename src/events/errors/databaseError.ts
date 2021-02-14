import { Colors } from '#lib/types/Constants';
import { rootFolder } from '#utils/constants';
import { Command, Event } from '@sapphire/framework';
import { codeBlock, inlineCodeBlock } from '@sapphire/utilities';
import { Message, MessageEmbed } from 'discord.js';
import type { QueryFailedError } from 'typeorm';

export class UserEvent extends Event {
	public async run(message: Message, command: Command, error: QueryFailedError) {
		const output = [
			`${inlineCodeBlock('Command   ::')} ${command.path.slice(rootFolder.length)}`,
			// `${inlineCodeBlock('Arguments ::')} ${message.args.length ? `[\`${message.args.join('`, `')}\`]` : 'Not Supplied'}`,
			`${inlineCodeBlock('Error     ::')} ${codeBlock('js', error.stack || error)}`
		].join('\n');

		await this.context.client.webhookDatabase!.send(
			new MessageEmbed()
				.setDescription(output)
				.setColor(Colors.Red)
				.setAuthor(message.author.tag, message.author.displayAvatarURL({ size: 128, format: 'png', dynamic: true }), message.url)
				.setTimestamp()
		);
	}
}
