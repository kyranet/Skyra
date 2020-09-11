import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { Kitsu } from '@lib/types/definitions/Kitsu';
import { TOKENS } from '@root/config';
import { cutText } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Mime } from '@utils/constants';
import { fetch, FetchMethods, FetchResultTypes } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, Timestamp } from 'klasa';
import { stringify } from 'querystring';

const API_URL = `https://${TOKENS.KITSU_ID}-dsn.algolia.net/1/indexes/production_media/query`;

@ApplyOptions<RichDisplayCommandOptions>({
	cooldown: 10,
	description: (language) => language.get('commandAnimeDescription'),
	extendedHelp: (language) => language.get('commandAnimeExtended'),
	usage: '<animeName:string>'
})
export default class extends RichDisplayCommand {
	private readonly kTimestamp = new Timestamp('MMMM d YYYY');

	public async run(message: KlasaMessage, [animeName]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(message.language.get('systemLoading')).setColor(BrandingColors.Secondary)
		);

		const { hits: entries } = await this.fetchAPI(message, animeName);
		if (!entries.length) throw message.language.get('systemNoResults');

		const display = await this.buildDisplay(entries, message);

		await display.start(response, message.author.id);
		return response;
	}

	private async fetchAPI(message: KlasaMessage, animeName: string) {
		try {
			return fetch<Kitsu.KitsuResult>(
				API_URL,
				{
					method: FetchMethods.Post,
					headers: {
						'Content-Type': Mime.Types.ApplicationJson,
						'X-Algolia-API-Key': TOKENS.KITSU_KEY,
						'X-Algolia-Application-Id': TOKENS.KITSU_ID
					},
					body: JSON.stringify({
						params: stringify({
							query: animeName,
							facetFilters: ['kind:anime'],
							hitsPerPage: 10
						})
					})
				},
				FetchResultTypes.JSON
			);
		} catch {
			throw message.language.get('systemQueryFail');
		}
	}

	private async buildDisplay(entries: Kitsu.KitsuHit[], message: KlasaMessage) {
		const embedData = message.language.get('commandAnimeEmbedData');
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message))).setFooterSuffix(' - © kitsu.io');

		for (const entry of entries) {
			const description =
				// Prefer the synopsis
				entry.synopsis ||
				// Then prefer the English description
				entry.description?.en ||
				// Then prefer the English-us description
				entry.description?.en_us ||
				// Then prefer the latinized Japanese description
				entry.description?.en_jp ||
				// Then the description in kanji / hiragana / katakana
				entry.description?.ja_jp ||
				// If all fails just get the first key of the description
				entry.description?.[Object.keys(entry.description!)[0]];
			const synopsis = description ? cutText(description.replace(/(.+)[\r\n\t](.+)/gim, '$1 $2').split('\r\n')[0], 750) : null;
			const score = `${entry.averageRating}%`;
			const animeURL = `https://kitsu.io/anime/${entry.id}`;
			const type = entry.subtype;
			const title = entry.titles.en || entry.titles.en_jp || entry.canonicalTitle || '--';

			const [englishTitle, japaneseTitle, canonicalTitle] = [
				entry.titles.en || entry.titles.en_us,
				entry.titles.ja_jp,
				entry.canonicalTitle
			].map((title) => title || message.language.get('globalNone'));

			display.addPage((embed: MessageEmbed) =>
				embed
					.setTitle(title)
					.setURL(animeURL)
					.setDescription(
						message.language.get('commandAnimeOutputDescription', {
							englishTitle,
							japaneseTitle,
							canonicalTitle,
							synopsis: synopsis ?? message.language.get('commandAnimeNoSynopsis')
						})
					)
					.setThumbnail(entry.posterImage?.original ?? '')
					.addField(embedData.type, message.language.get('commandAnimeTypes')[type.toUpperCase()] || type, true)
					.addField(embedData.score, score, true)
					.addField(embedData.episodes, entry.episodeCount ? entry.episodeCount : embedData.stillAiring, true)
					.addField(embedData.episodeLength, message.language.duration(entry.episodeLength * 60 * 1000), true)
					.addField(embedData.ageRating, entry.ageRating, true)
					.addField(embedData.firstAirDate, this.kTimestamp.display(entry.startDate * 1000), true)
					.addField(embedData.watchIt, `**[${title}](${animeURL})**`)
			);
		}
		return display;
	}
}
