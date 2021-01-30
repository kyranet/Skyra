import { DbSet } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { PaginatedMessageCommand, UserPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { AgeRatingRatingEnum, Company, Game } from '#lib/types/definitions/Igdb';
import { TOKENS } from '#root/config';
import { Mime } from '#utils/constants';
import { fetch, FetchMethods, FetchResultTypes, sendLoadingMessage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { cutText, isNumber, roundNumber } from '@sapphire/utilities';
import { MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

const API_URL = 'https://api.igdb.com/v4/games';

function isArrayOfNumbers(array: unknown[]): array is number[] {
	return array.every((val) => isNumber(val));
}

function isIgdbCompany(company: unknown): company is Company {
	return (company as Company).id !== undefined;
}

@ApplyOptions<PaginatedMessageCommand.Options>({
	cooldown: 10,
	description: LanguageKeys.Commands.Tools.IgdbDescription,
	extendedHelp: LanguageKeys.Commands.Tools.IgdbExtended
})
export class UserPaginatedMessageCommand extends PaginatedMessageCommand {
	private readonly urlRegex = /https?:/i;
	private readonly igdbRequestHeaders = {
		'Content-Type': Mime.Types.TextPlain,
		Accept: Mime.Types.ApplicationJson,
		'Client-ID': TOKENS.TWITCH_CLIENT_ID
	};

	private readonly commonQuery = [
		`fields ${[
			'name',
			'url',
			'summary',
			'rating',
			'involved_companies.developer',
			'involved_companies.company.name',
			'genres.name',
			'release_dates.date',
			'platforms.name',
			'cover.url',
			'age_ratings.rating',
			'age_ratings.category'
		].join(',')}`,
		'limit 10',
		'offset 0'
	].join('; ');

	public async run(message: GuildMessage, args: PaginatedMessageCommand.Args) {
		const game = await args.rest('string');

		const response = await sendLoadingMessage(message, args.t);
		const entries = await this.fetchAPI(args.t, game);
		if (!entries.length) return this.error(args.t(LanguageKeys.System.NoResults));

		const display = await this.buildDisplay(message, args.t, entries);
		await display.start(response as GuildMessage, message.author);
		return response;
	}

	private async fetchAPI(t: TFunction, game: string) {
		try {
			return await fetch<Game[]>(
				API_URL,
				{
					method: FetchMethods.Post,
					headers: {
						...this.igdbRequestHeaders,
						Authorization: `Bearer ${await this.context.client.twitch.fetchBearer()}`
					},
					body: `search: "${game}"; ${this.commonQuery};`
				},
				FetchResultTypes.JSON
			);
		} catch {
			throw t(LanguageKeys.System.QueryFail);
		}
	}

	private async buildDisplay(message: GuildMessage, t: TFunction, entries: Game[]) {
		const titles = t(LanguageKeys.Commands.Tools.IgdbTitles);
		const fieldsData = t(LanguageKeys.Commands.Tools.IgdbData);
		const display = new UserPaginatedMessage({ template: new MessageEmbed().setColor(await DbSet.fetchColor(message)) });

		for (const game of entries) {
			const coverImg = this.resolveCover(game.cover);
			const userRating = game.rating ? `${roundNumber(game.rating, 2)}%` : fieldsData.noRating;

			display.addPageEmbed((embed) =>
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
							`**${titles.releaseDate}**: ${this.resolveReleaseDate(t, game.release_dates, fieldsData.noReleaseDate)}`,
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

	private resolveReleaseDate(t: TFunction, releaseDates: Game['release_dates'], fallback: string) {
		if (!releaseDates || releaseDates.length === 0 || isArrayOfNumbers(releaseDates) || !releaseDates[0].date) return fallback;
		return t(LanguageKeys.Globals.DateValue, { value: releaseDates[0].date * 1000 });
	}

	private resolvePlatforms(platforms: Game['platforms'], fallback: string) {
		if (!platforms || isArrayOfNumbers(platforms)) return fallback;
		return platforms.map((platform) => platform.name).join(', ');
	}
}
