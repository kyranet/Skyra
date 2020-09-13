import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { CdnUrls } from '@lib/types/Constants';
import { OverwatchDataSet, OverwatchStatsTypeUnion, PlatformUnion, TopHero } from '@lib/types/definitions/Overwatch';
import { toTitleCase } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Time } from '@utils/constants';
import { fetch, FetchResultTypes, pickRandom } from '@utils/util';
import { Collection, MessageEmbed } from 'discord.js';
import { KlasaMessage, LanguageKeys, Timestamp } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['ow'],
	cooldown: 10,
	description: (language) => language.get('commandOverwatchDescription'),
	extendedHelp: (language) => language.get('commandOverwatchExtended'),
	usage: '<xbl|psn|pc:default> <player:...overwatchplayer>',
	usageDelim: ' '
})
export default class extends RichDisplayCommand {
	private readonly kPlayTimestamp = new Timestamp('H [hours] - m [minutes]');

	public async run(message: KlasaMessage, [platform = 'pc', player]: [PlatformUnion, string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get('systemLoading'))).setColor(BrandingColors.Secondary)
		);

		const overwatchData = await this.fetchAPI(message, player, platform);

		if (overwatchData.error) throw message.language.get('systemQueryFail');
		if (!overwatchData.competitiveStats.topHeroes || !overwatchData.quickPlayStats.topHeroes) {
			throw message.language.get('commandOverwatchNoStats', { player: this.decodePlayerName(player) });
		}

		const display = await this.buildDisplay(message, overwatchData, player, platform);
		await display.start(response, message.author.id);
		return response;
	}

	/** Queries the Overwatch API for data on a player with platform */
	private async fetchAPI(message: KlasaMessage, player: string, platform: PlatformUnion) {
		try {
			return await fetch<OverwatchDataSet>(`https://ow-api.com/v1/stats/${platform}/global/${player}/complete`, FetchResultTypes.JSON);
		} catch {
			throw message.language.get('commandOverwatchQueryFail', { player: this.decodePlayerName(player), platform });
		}
	}

	/** Builds a UserRichDisplay for presenting Overwatch data */
	private async buildDisplay(message: KlasaMessage, overwatchData: OverwatchDataSet, player: string, platform: PlatformUnion) {
		let ratings = Array.from(
			this.ratingsToCollection(
				overwatchData.ratings ?? [],
				(r) => r.role,
				(r) => r
			)
				.mapValues((rating) => {
					return `**${toTitleCase(rating.role)}:** ${
						typeof rating.level === 'number' ? message.language.groupDigits(rating.level) : rating.level
					}`;
				})
				.values()
		).join('\n');

		const embedData = message.language.get('commandOverwatchEmbedData', {
			authorName: overwatchData.name,
			playerLevel: overwatchData.level,
			prestigeLevel: overwatchData.level + overwatchData.prestige * 100,
			totalGamesWon: overwatchData.gamesWon
		});

		return new UserRichDisplay(
			new MessageEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setAuthor(embedData.author, CdnUrls.OverwatchLogo)
				.setTitle(embedData.title)
				.setURL(`https://overwatchtracker.com/profile/${platform}/global/${player}`)
				.setThumbnail(overwatchData.icon)
		)
			.addPage((embed) =>
				embed
					.setDescription(
						[
							embedData.headers.account,
							embedData.playerLevel,
							embedData.prestigeLevel,
							overwatchData.gamesWon ? embedData.totalGamesWon : embedData.noGamesWon
						].join('\n')
					)
					.addField(embedData.ratingsTitle, ratings || message.language.get('globalNone'))
			)
			.addPage((embed) => embed.setDescription(this.extractStats(message, overwatchData, 'quickPlayStats', embedData)))
			.addPage((embed) => embed.setDescription(this.extractStats(message, overwatchData, 'competitiveStats', embedData)))
			.addPage((embed) => embed.setDescription(this.extractTopHeroes(message, overwatchData, 'quickPlayStats', embedData)))
			.addPage((embed) => embed.setDescription(this.extractTopHeroes(message, overwatchData, 'competitiveStats', embedData)));
	}

	/**
	 * Creates a `Map` using the `keyExtractor` and `valueExtractor` to obtain the key and value of each element
	 * in an `Array` of `object`s
	 * @remark If multiple elements have the same `key` then only the last element with that `key` will be included
	 * @param inputArray The array of objects to transform into a Map
	 * @param keyExtractor A function that describes where to find the `key` for the `Map`
	 * @param valueExtractor A function that describes where to find the `value` for the `Map`
	 * @returns a `Map<Key, Value>` of the values, mapped by the given key
	 */
	private ratingsToCollection<I, K, V>(inputArray: readonly I[], keyExtractor: (_: I) => K, valueExtractor: (_: I) => V): Collection<K, V> {
		return inputArray.reduce<Collection<K, V>>(
			(accumulator: Collection<K, V>, element: I) => accumulator.set(keyExtractor(element), valueExtractor(element)),
			new Collection<K, V>()
		);
	}

	/** Retrieves the top 5 heroes (name and time played in milliseconds) for either `competitiveStats` or `quickPlayStats` */
	private getTopHeroes(overwatchData: OverwatchDataSet, type: OverwatchStatsTypeUnion): TopHero[] {
		const overwatchDataType = overwatchData[type];

		return Object.keys(overwatchDataType.topHeroes)
			.map((hero) => {
				const timePlayed = overwatchDataType.topHeroes[hero].timePlayed.split(':').map(parseFloat);
				const seconds =
					timePlayed.length === 3
						? Number(timePlayed[0] * 3600) + Number(timePlayed[1] * 60) + Number(timePlayed[0])
						: Number(timePlayed[0] * 60) + Number(timePlayed[1]);

				return { hero, time: seconds * Time.Second };
			})
			.sort((a, b) => b.time - a.time)
			.slice(0, 5);
	}

	/** Extracts statistics from overwatchData for either competitive play or quickplay and returns it in a format valid for `MessageEmbed` description */
	private extractStats(
		message: KlasaMessage,
		overwatchData: OverwatchDataSet,
		type: OverwatchStatsTypeUnion,
		embedData: ReturnType<LanguageKeys['commandOverwatchEmbedData']>
	) {
		const {
			careerStats: {
				allHeroes: {
					combat: { finalBlows, deaths, damageDone, objectiveKills, soloKills },
					assists: { healingDone },
					game: { timePlayed }
				}
			},
			games: { won: gamesWon },
			awards: { medalsBronze, medalsSilver, medalsGold }
		} = overwatchData[type];

		const timePlayedMilliseconds = Number(timePlayed.split(':')[0]) * Time.Hour + Number(timePlayed.split(':')[1]) * Time.Minute;
		const statsData = message.language.get('commandOverwatchEmbedDataStats', {
			finalBlows,
			deaths,
			damageDone,
			healing: healingDone,
			objectiveKills,
			soloKills,
			playTime: timePlayedMilliseconds,
			gamesWon,
			goldenMedals: medalsGold,
			silverMedals: medalsSilver,
			bronzeMedals: medalsBronze
		});

		return [
			embedData.headers[type === 'competitiveStats' ? 'competitive' : 'quickplay'],
			statsData.finalBlows,
			statsData.deaths,
			statsData.damageDealt,
			statsData.healing,
			statsData.objectiveKills,
			statsData.soloKills,
			statsData.playTime,
			statsData.gamesWon,
			statsData.goldenMedals,
			statsData.silverMedals,
			statsData.bronzeMedals
		].join('\n');
	}

	/** Extracts top heroes from overwatchData for either competitive play or quickplay and returns it in a format valid for `MessageEmbed` description */
	private extractTopHeroes(
		message: KlasaMessage,
		overwatchData: OverwatchDataSet,
		type: OverwatchStatsTypeUnion,
		embedData: ReturnType<LanguageKeys['commandOverwatchEmbedData']>
	) {
		const topHeroes = this.getTopHeroes(overwatchData, type);

		return [
			embedData.headers[type === 'competitiveStats' ? 'topHeroesCompetitive' : 'topHeroesQuickplay'],
			...topHeroes.map((topHero) =>
				message.language.get('commandOverwatchEmbedDataTopHero', {
					name: topHero.hero,
					playTime: this.kPlayTimestamp.display(topHero.time)
				})
			)
		].join('\n');
	}

	private decodePlayerName(name: string) {
		return decodeURIComponent(name.replace('-', '#'));
	}
}
