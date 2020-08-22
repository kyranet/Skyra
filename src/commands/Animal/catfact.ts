import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { fetch, FetchResultTypes } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['kittenfact'],
			cooldown: 10,
			description: (language) => language.get('COMMAND_CATFACT_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_CATFACT_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			spam: true
		});
	}

	public async run(message: KlasaMessage) {
		const { fact } = await fetch<CatfactResultOk>('https://catfact.ninja/fact', FetchResultTypes.JSON);
		return message.sendEmbed(
			new MessageEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setTitle(message.language.get('COMMAND_CATFACT_TITLE'))
				.setDescription(fact)
		);
	}
}

export interface CatfactResultOk {
	fact: string;
	length: number;
}
