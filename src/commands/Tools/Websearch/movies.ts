import { LanguageKeys } from '#lib/i18n/languageKeys';
import { PaginatedMessageCommand, SkyraPaginatedMessage } from '#lib/structures';
import type { Tmdb } from '#lib/types/definitions/Tmdb';
import { minutes } from '#utils/common';
import { formatNumber } from '#utils/functions';
import { getColor, sendLoadingMessage } from '#utils/util';
import { time, TimestampStyles } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { cutText } from '@sapphire/utilities';
import { envIsDefined } from '@skyra/env-utilities';
import { Message, MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';
import { URL } from 'node:url';

@ApplyOptions<PaginatedMessageCommand.Options>({
	enabled: envIsDefined('THEMOVIEDATABASE_TOKEN'),
	aliases: ['movie', 'tmdb'],
	description: LanguageKeys.Commands.Tools.MoviesDescription,
	detailedDescription: LanguageKeys.Commands.Tools.MoviesExtended
})
export class UserPaginatedMessageCommand extends PaginatedMessageCommand {
	public async messageRun(message: Message, args: PaginatedMessageCommand.Args) {
		const [movie, year = null] = (await args.rest('string')).split('y:');

		const response = await sendLoadingMessage(message, args.t);
		const { results: entries } = await this.fetchAPI(movie.trim(), year);
		if (!entries.length) this.error(LanguageKeys.System.NoResults);

		const display = await this.buildDisplay(message, args.t, entries);
		await display.run(response, message.author);
		return response;
	}

	private async fetchAPI(movie: string, year: string | null) {
		try {
			const url = new URL('https://api.themoviedb.org/3/search/movie');
			url.searchParams.append('api_key', process.env.THEMOVIEDATABASE_TOKEN);
			url.searchParams.append('query', movie);
			if (year !== null) url.searchParams.append('year', year.trim());

			return await fetch<Tmdb.TmdbMovieList>(url, FetchResultTypes.JSON);
		} catch {
			this.error(LanguageKeys.System.QueryFail);
		}
	}

	private async fetchMovieData(movieId: number) {
		try {
			const url = new URL(`https://api.themoviedb.org/3/movie/${movieId}`);
			url.searchParams.append('api_key', process.env.THEMOVIEDATABASE_TOKEN);

			return await fetch<Tmdb.TmdbMovie>(url, FetchResultTypes.JSON);
		} catch {
			this.error(LanguageKeys.System.QueryFail);
		}
	}

	private async buildDisplay(message: Message, t: TFunction, movies: Tmdb.TmdbMovieList['results']) {
		const titles = t(LanguageKeys.Commands.Tools.MoviesTitles);
		const fieldsData = t(LanguageKeys.Commands.Tools.MoviesData);
		const display = new SkyraPaginatedMessage({
			template: new MessageEmbed().setColor(getColor(message))
		}).setSelectMenuOptions((pageIndex) => ({
			label: movieData[pageIndex - 1].title
		}));

		const movieData = await Promise.all(movies.map((movie) => this.fetchMovieData(movie.id)));

		for (const movie of movieData) {
			display.addPageEmbed((embed) => {
				const runTime = movie.runtime
					? t(LanguageKeys.Globals.DurationValue, { value: minutes(movie.runtime) })
					: fieldsData.movieInProduction;
				const userScore = typeof movie.vote_average === 'number' ? formatNumber(t, movie.vote_average) : fieldsData.movieInProduction;
				const releaseDate = movie.release_date
					? time(new Date(movie.release_date), TimestampStyles.ShortDate)
					: t(LanguageKeys.Globals.Unknown);
				const imdbPage = movie.imdb_id ? `[${fieldsData.linkClickHere}](http://www.imdb.com/title/${movie.imdb_id})` : fieldsData.none;

				return embed
					.setTitle(movie.title)
					.setURL(`https://www.themoviedb.org/movie/${movie.id}`)
					.setImage(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
					.setThumbnail(`https://image.tmdb.org/t/p/original${movie.poster_path}`)
					.setDescription(cutText(movie.overview, 750))
					.addField(titles.runtime, runTime, true)
					.addField(titles.userScore, userScore, true)
					.addField(titles.status, movie.status, true)
					.addField(titles.releaseDate, releaseDate, true)
					.addField(titles.imdbPage, imdbPage, true)
					.addField(titles.homePage, movie.homepage ? `[${fieldsData.linkClickHere}](${movie.homepage})` : fieldsData.none, true)
					.addField(titles.collection, movie.belongs_to_collection ? movie.belongs_to_collection.name : fieldsData.notPartOfCollection)
					.addField(titles.genres, movie.genres.length ? movie.genres.map((genre) => genre.name).join(', ') : fieldsData.noGenres);
			});
		}

		return display;
	}
}
