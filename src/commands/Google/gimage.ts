import { DbSet } from '#lib/database';
import { RichDisplayCommand, RichDisplayCommandOptions } from '#lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '#lib/structures/UserRichDisplay';
import { GuildMessage } from '#lib/types';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { BrandingColors } from '#utils/constants';
import { CustomSearchType, GoogleCSEImageData, GoogleResponseCodes, handleNotOK, queryGoogleCustomSearchAPI } from '#utils/Google';
import { IMAGE_EXTENSION, pickRandom } from '#utils/util';
import { parseURL } from '@sapphire/utilities';
import { ApplyOptions, CreateResolvers } from '@skyra/decorators';
import { MessageEmbed } from 'discord.js';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['googleimage', 'img'],
	cooldown: 10,
	nsfw: true, // Google will return explicit results when seaching for explicit terms, even when safe-search is on
	description: (language) => language.get(LanguageKeys.Commands.Google.GimageDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Google.GimageExtended),
	usage: '<query:query>'
})
@CreateResolvers([
	[
		'query',
		(arg, possible, message) =>
			message.client.arguments
				.get('string')!
				.run(arg.replace(/(who|what|when|where) ?(was|is|were|are) ?/gi, '').replace(/ /g, '+'), possible, message)
	]
])
export default class extends RichDisplayCommand {
	public async run(message: GuildMessage, [query]: [string]) {
		const language = await message.fetchLanguage();
		const [response, { items }] = await Promise.all([
			message.sendEmbed(
				new MessageEmbed().setDescription(pickRandom(language.get(LanguageKeys.System.Loading))).setColor(BrandingColors.Secondary)
			),
			queryGoogleCustomSearchAPI<CustomSearchType.Image>(message, CustomSearchType.Image, query)
		]);

		if (!items || !items.length) throw language.get(handleNotOK(GoogleResponseCodes.ZeroResults, message.client));

		const display = await this.buildDisplay(message, items);

		await display.start(response, message.author.id);
		return response;
	}

	private async buildDisplay(message: GuildMessage, items: GoogleCSEImageData[]) {
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const item of items) {
			display.addPage((embed) => {
				embed.setTitle(item.title).setURL(item.image.contextLink);

				const imageUrl = IMAGE_EXTENSION.test(item.link) && parseURL(item.link);
				if (imageUrl) {
					embed.setImage(imageUrl.toString());
				}

				return embed;
			});
		}

		return display;
	}
}
