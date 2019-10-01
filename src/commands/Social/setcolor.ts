import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { parse } from '../../lib/util/Color';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['setcolour'],
			bucket: 2,
			cooldown: 10,
			description: language => language.get('COMMAND_SETCOLOR_DESCRIPTION'),
			extendedHelp: language => language.get('COMMAND_SETCOLOR_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			spam: true,
			usage: '<color:string>'
		});
	}

	public async run(message: KlasaMessage, [input]: [string]) {
		const { hex, b10 } = parse(input);

		await message.author!.settings.sync();
		await message.author!.settings.update('color', hex.toString().slice(1));
		return message.sendEmbed(new MessageEmbed()
			.setColor(b10.value)
			.setAuthor(message.author!.tag, message.author!.displayAvatarURL({ size: 128 }))
			.setDescription(message.language.get('COMMAND_SETCOLOR', hex)));
	}

}
