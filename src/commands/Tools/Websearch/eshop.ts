import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { TOKENS } from '@root/config';
import { cutText, toTitleCase } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Mime } from '@utils/constants';
import { fetch, FetchMethods, FetchResultTypes, pickRandom } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { decode } from 'he';
import { KlasaMessage, Timestamp } from 'klasa';
import { stringify } from 'querystring';

const API_URL = `https://${TOKENS.NINTENDO_ID}-dsn.algolia.net/1/indexes/*/queries`;

@ApplyOptions<RichDisplayCommandOptions>({
	cooldown: 10,
	description: (language) => language.get(LanguageKeys.Commands.Tools.EshopDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Tools.EshopExtended),
	usage: '<gameName:string>'
})
export default class extends RichDisplayCommand {
	private releaseDateTimestamp = new Timestamp('MMMM d YYYY');

	public async run(message: KlasaMessage, [gameName]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get(LanguageKeys.System.Loading))).setColor(BrandingColors.Secondary)
		);

		const { results: entries } = await this.fetchAPI(message, gameName);
		if (!entries.length) throw message.language.get(LanguageKeys.System.QueryFail);

		const display = await this.buildDisplay(entries[0].hits, message);
		await display.start(response, message.author.id);
		return response;
	}

	private async fetchAPI(message: KlasaMessage, gameName: string) {
		try {
			return fetch<EshopResult>(
				API_URL,
				{
					method: FetchMethods.Post,
					headers: {
						'Content-Type': Mime.Types.ApplicationJson,
						'X-Algolia-API-Key': TOKENS.NINTENDO_KEY,
						'X-Algolia-Application-Id': TOKENS.NINTENDO_ID
					},
					body: JSON.stringify({
						requests: [
							{
								indexName: 'noa_aem_game_en_us',
								params: stringify({
									facetFilters: ['type:game'],
									hitsPerPage: 10,
									maxValuesPerFacet: 30,
									page: 0,
									query: gameName
								})
							}
						]
					})
				},
				FetchResultTypes.JSON
			);
		} catch {
			throw message.language.get(LanguageKeys.System.QueryFail);
		}
	}

	private async buildDisplay(entries: EShopHit[], message: KlasaMessage) {
		const titles = message.language.get(LanguageKeys.Commands.Tools.EshopTitles);
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const game of entries) {
			const description = cutText(decode(game.description).replace(/\s\n {2,}/g, ' '), 750);
			const price = game.msrp
				? game.msrp > 0
					? message.language.get(LanguageKeys.Commands.Tools.EshopPricePaid, { price: game.msrp })
					: message.language.get(LanguageKeys.Commands.Tools.EshopPriceFree)
				: 'TBD';
			const esrbText = game.esrb
				? [`**${game.esrb}**`, game.esrbDescriptors && game.esrbDescriptors.length ? ` - ${game.esrbDescriptors.join(', ')}` : ''].join('')
				: message.language.get(LanguageKeys.Commands.Tools.EshopNotInDatabase);

			display.addPage((embed: MessageEmbed) =>
				embed
					.setTitle(game.title)
					.setURL(`https://nintendo.com${game.url}`)
					.setThumbnail(`https://nintendo.com${game.boxArt}`)
					.setDescription(description)
					.addField(titles.price, price, true)
					.addField(titles.availability, game.availability[0], true)
					.addField(
						titles.releaseDate,
						game.releaseDateMask === 'TBD' ? game.releaseDateMask : this.releaseDateTimestamp.displayUTC(game.releaseDateMask),
						true
					)
					.addField(titles.numberOfPlayers, toTitleCase(game.players), true)
					.addField(titles.platform, game.platform, true)
					.addField(titles.nsuid, game.nsuid || 'TBD', true)
					.addField(titles.esrb, esrbText)
					.addField(titles.categories, game.categories.join(', ') || titles.noCategories)
			);
		}
		return display;
	}
}

interface EShopHit {
	type: string;
	locale: string;
	url: string;
	title: string;
	description: string;
	lastModified: number;
	id: string;
	nsuid: string;
	slug: string;
	boxArt: string;
	gallery: string;
	platform: string;
	releaseDateMask: string;
	characters: string[];
	categories: string[];
	msrp: number | null;
	esrb?: string;
	esrbDescriptors?: string[];
	virtualConsole: string;
	generalFilters: string[];
	filterShops: string[];
	filterPlayers: string[];
	publishers: string[];
	developers: string[];
	players: string;
	featured: boolean;
	freeToStart: boolean;
	priceRange: string | null;
	salePrice: number | null;
	availability: string[];
	objectID: string;
}

interface EshopData {
	hits: EShopHit[];
	nbHits: number;
	page: number;
	nbPages: number;
	hitsPerPage: number;
	processingTimeMS: number;
}

interface EshopResult {
	results: EshopData[];
}
