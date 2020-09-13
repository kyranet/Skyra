import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { TOKENS } from '@root/config';
import { cutText, isNumber, roundNumber } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { AgeRatingRatingEnum, Company, Game } from '@utils/External/IgdbTypes';
import { fetch, FetchMethods, FetchResultTypes, pickRandom } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, Timestamp } from 'klasa';

const API_URL = 'https://api-v3.igdb.com/games';

function isArrayOfNumbers(array: unknown[]): array is number[] {
	return array.every((val) => isNumber(val));
}

function isIgdbCompany(company: unknown): company is Company {
	return (company as Company).id !== undefined;
}

@ApplyOptions<RichDisplayCommandOptions>({
	cooldown: 10,
	description: (language) => language.get('commandIgdbDescription'),
	extendedHelp: (language) => language.get('commandIgdbExtended'),
	usage: '<game:str>'
})
export default class extends RichDisplayCommand {
	private releaseDateTimestamp = new Timestamp('MMMM d YYYY');
	private urlRegex = /https?:/i;

	public async run(message: KlasaMessage, [game]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get('systemLoading'))).setColor(BrandingColors.Secondary)
		);

		const entries = await this.fetchAPI(message, game);
		if (!entries.length) throw message.language.get('systemNoResults');

		const display = await this.buildDisplay(entries, message);
		await display.start(response, message.author.id);
		return response;
	}

	private async fetchAPI(message: KlasaMessage, game: string) {
		try {
			return await fetch<Game[]>(
				API_URL,
				{
					method: FetchMethods.Post,
					headers: {
						'user-key': TOKENS.INTERNETGAMEDATABASE_KEY
					},
					body: [
						`search: "${game}";`,
						'fields name, url, summary, rating, involved_companies.developer,',
						'involved_companies.company.name, genres.name, release_dates.date,',
						'platforms.name, cover.url, age_ratings.rating, age_ratings.category;',
						'limit 10;',
						'offset 0;'
					].join('')
				},
				FetchResultTypes.JSON
			);
		} catch {
			throw message.language.get('systemQueryFail');
		}
	}

	private async buildDisplay(entries: Game[], message: KlasaMessage) {
		const titles = message.language.get('commandIgdbTitles');
		const fieldsData = message.language.get('commandIgdbData');
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const game of entries) {
			const coverImg = this.resolveCover(game.cover);
			const userRating = game.rating ? `${roundNumber(game.rating, 2)}%` : fieldsData.noRating;

			display.addPage((embed: MessageEmbed) =>
				embed
					.setTitle(game.name)
					.setURL(game.url || '')
					.setThumbnail(coverImg)
					.setDescription(
						[
							this.resolveSummary(game.summary, fieldsData.noSummary),
							'',
							`**${titles.userScore}**: ${userRating}`,
							`**${titles.ageRating}**: ${this.resolveAgeRating(game.age_ratings, fieldsData.noAgeRatings)}`,
							`**${titles.releaseDate}**: ${this.resolveReleaseDate(game.release_dates, fieldsData.noReleaseDate)}`,
							`**${titles.genres}**: ${this.resolveGenres(game.genres, fieldsData.noGenres)}`,
							`**${titles.developers}**: ${this.resolveDevelopers(game.involved_companies, fieldsData.noDevelopers)}`,
							`**${titles.platform}**: ${this.resolvePlatforms(game.platforms, fieldsData.noPlatforms)}`
						].join('\n')
					)
			);
		}

		return display;
	}

	private resolveCover(cover: Game['cover']) {
		if (!cover || isNumber(cover) || !cover.url) return '';

		return this.urlRegex.test(cover.url) ? cover.url : `https:${cover.url}`;
	}

	private resolveSummary(summary: Game['summary'], fallback: string) {
		if (!summary) return fallback;
		return cutText(summary, 750);
	}

	private resolveAgeRating(ageRatings: Game['age_ratings'], fallback: string) {
		if (!ageRatings || isArrayOfNumbers(ageRatings)) return fallback;
		return ageRatings.map((ageRating) => `${ageRating.category === 1 ? 'ESRB' : 'PEGI'}: ${AgeRatingRatingEnum[ageRating.rating ?? 0]}`);
	}

	private resolveGenres(genres: Game['genres'], fallback: string) {
		if (!genres || isArrayOfNumbers(genres)) return fallback;
		return genres.map((genre) => genre.name).join(', ');
	}

	private resolveDevelopers(developers: Game['involved_companies'], fallback: string) {
		if (!developers || isArrayOfNumbers(developers)) return fallback;
		return developers
			.map((involvedCompany) => {
				if (isIgdbCompany(involvedCompany.company)) {
					return involvedCompany.company.name;
				}

				return null;
			})
			.filter(Boolean)
			.join(', ');
	}

	private resolveReleaseDate(releaseDates: Game['release_dates'], fallback: string) {
		if (!releaseDates || releaseDates.length === 0 || isArrayOfNumbers(releaseDates) || !releaseDates[0].date) return fallback;
		return this.releaseDateTimestamp.displayUTC(releaseDates[0].date * 1000);
	}

	private resolvePlatforms(platforms: Game['platforms'], fallback: string) {
		if (!platforms || isArrayOfNumbers(platforms)) return fallback;
		return platforms.map((platform) => platform.name).join(', ');
	}
}
