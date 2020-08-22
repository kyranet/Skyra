import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { parseURL } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { CustomSearchType, GoogleResponseCodes, GooleCSEItem, handleNotOK, queryGoogleCustomSearchAPI } from '@utils/Google';
import { IMAGE_EXTENSION } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['google', 'googlesearch', 'g', 'search'],
	cooldown: 10,
	description: (language) => language.get('COMMAND_GSEARCH_DESCRIPTION'),
	extendedHelp: (language) => language.get('COMMAND_GSEARCH_EXTENDED'),
	usage: '<query:query>'
})
export default class extends RichDisplayCommand {
	public async init() {
		this.createCustomResolver('query', (arg, possible, message) =>
			this.client.arguments
				.get('string')!
				.run(arg.replace(/(who|what|when|where) ?(was|is|were|are) ?/gi, '').replace(/ /g, '+'), possible, message)
		);
	}

	public async run(message: KlasaMessage, [query]: [string]) {
		const [response, { items }] = await Promise.all([
			message.sendEmbed(new MessageEmbed().setDescription(message.language.get('SYSTEM_LOADING')).setColor(BrandingColors.Secondary)),
			queryGoogleCustomSearchAPI<CustomSearchType.Search>(message, CustomSearchType.Search, query)
		]);

		if (!items || !items.length) throw message.language.get(handleNotOK(GoogleResponseCodes.ZeroResults, message.client));

		const display = await this.buildDisplay(message, items);

		await display.start(response, message.author.id);
		return response;
	}

	private async buildDisplay(message: KlasaMessage, items: GooleCSEItem[]) {
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const item of items) {
			display.addPage((embed: MessageEmbed) => {
				embed.setTitle(item.title).setURL(item.link).setDescription(item.snippet);

				const imageUrl = item.pagemap?.cse_image?.find((image) => IMAGE_EXTENSION.test(image.src) && parseURL(image.src))?.src ?? '';
				if (imageUrl) {
					embed.setImage(imageUrl);
				}

				return embed;
			});
		}

		return display;
	}
}
