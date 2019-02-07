import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { fetch } from '../../lib/util/util';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['chucknorris'],
			cooldown: 10,
			description: (language) => language.get('COMMAND_NORRIS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_NORRIS_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			spam: true
		});
	}

	public async run(message: KlasaMessage) {
		const data = await fetch('https://api.chucknorris.io/jokes/random', 'json');
		return message.sendEmbed(new MessageEmbed()
			.setColor(0x80D8FF)
			.setTitle(message.language.get('COMMAND_NORRIS_OUTPUT'))
			.setURL(data.url)
			.setThumbnail(data.icon_url)
			.setDescription(data.value));
	}

}
