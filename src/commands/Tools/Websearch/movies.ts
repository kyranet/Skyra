import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { Tmdb } from '@lib/types/definitions/Tmdb';
import { TOKENS } from '@root/config';
import { cutText } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { fetch, FetchResultTypes, pickRandom } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, Timestamp } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['movie', 'tmdb'],
	cooldown: 10,
	description: (language) => language.get('commandMoviesDescription'),
	extendedHelp: (language) => language.get('commandMoviesExtended'),
	usage: '<movie:str> [year:str]',
	usageDelim: 'y:'
})
export default class extends RichDisplayCommand {
	private releaseDateTimestamp = new Timestamp('MMMM d YYYY');

	public async run(message: KlasaMessage, [movie, year]: [string, string?]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get('systemLoading'))).setColor(BrandingColors.Secondary)
		);

		const { results: entries } = await this.fetchAPI(message, movie, year);
		if (!entries.length) throw message.language.get('systemNoResults');

		const display = await this.buildDisplay(entries, message);
		await display.start(response, message.author.id);
		return response;
	}

	private async fetchAPI(message: KlasaMessage, movie: string, year?: string) {
		try {
			const url = new URL('https://api.themoviedb.org/3/search/movie');
			url.searchParams.append('api_key', TOKENS.THEMOVIEDATABASE_KEY);
			url.searchParams.append('query', movie);

			if (year) url.searchParams.append('year', year);

			return await fetch<Tmdb.TmdbMovieList>(url, FetchResultTypes.JSON);
		} catch {
			throw message.language.get('systemQueryFail');
		}
	}

	private async fetchMovieData(message: KlasaMessage, movieId: number) {
		try {
			const url = new URL(`https://api.themoviedb.org/3/movie/${movieId}`);
			url.searchParams.append('api_key', TOKENS.THEMOVIEDATABASE_KEY);

			return await fetch<Tmdb.TmdbMovie>(url, FetchResultTypes.JSON);
		} catch {
			throw message.language.get('systemQueryFail');
		}
	}

	private async buildDisplay(movies: Tmdb.TmdbMovieList['results'], message: KlasaMessage) {
		const titles = message.language.get('commandMoviesTitles');
		const fieldsData = message.language.get('commandMoviesData');
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		const movieData = await Promise.all(movies.map((movie) => this.fetchMovieData(message, movie.id)));

		for (const movie of movieData) {
			display.addPage((embed: MessageEmbed) =>
				embed
					.setTitle(movie.title)
					.setURL(`https://www.themoviedb.org/movie/${movie.id}`)
					.setImage(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`)
					.setThumbnail(`https://image.tmdb.org/t/p/original${movie.poster_path}`)
					.setDescription(cutText(movie.overview, 750))
					.addField(
						titles.runtime,
						movie.runtime ? message.language.duration(movie.runtime * 60 * 1000) : fieldsData.movieInProduction,
						true
					)
					.addField(titles.userScore, movie.vote_average ? movie.vote_average : fieldsData.movieInProduction, true)
					.addField(titles.status, movie.status, true)
					.addField(titles.releaseDate, this.releaseDateTimestamp.displayUTC(movie.release_date), true)
					.addField(
						titles.imdbPage,
						movie.imdb_id ? `[${fieldsData.linkClickHere}](http://www.imdb.com/title/${movie.imdb_id})` : fieldsData.none,
						true
					)
					.addField(titles.homePage, movie.homepage ? `[${fieldsData.linkClickHere}](${movie.homepage})` : fieldsData.none, true)
					.addField(titles.collection, movie.belongs_to_collection ? movie.belongs_to_collection.name : fieldsData.notPartOfCollection)
					.addField(titles.genres, movie.genres.length ? movie.genres.map((genre) => genre.name).join(', ') : fieldsData.noGenres)
			);
		}

		return display;
	}
}
