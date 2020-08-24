import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { TOKENS } from '@root/config';
import { toTitleCase } from '@sapphire/utilities';
import { ApplyOptions, CreateResolvers } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { ClashOfClans } from '@utils/GameIntegration/ClashOfClans';
import { FetchResultTypes, fetch } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

const enum ClashOfClansFetchCategories {
	PLAYERS = 'players',
	CLANS = 'clans'
}

const kPlayerTagRegex = /#[A-Z0-9]{3,}/;
const kFilterSpecialCharacters = /[^A-Z0-9]+/gi;

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['coc'],
	cooldown: 10,
	description: (language) => language.get('commandClashofclansDescription'),
	extendedHelp: (language) => language.get('commandClashofclansExtended'),
	runIn: ['text'],
	subcommands: true,
	usage: '<player|clan:default> <query:tagOrName>',
	usageDelim: ' '
})
@CreateResolvers([
	[
		'tagOrName',
		(arg, possible, message, [action]) => {
			if (action === 'clan') {
				return message.client.arguments.get('...string')!.run(arg, possible, message);
			}

			if (action === 'player') {
				if (kPlayerTagRegex.test(arg)) return arg;
				throw message.language.get('commandClashofclansInvalidPlayerTag', { playertag: arg });
			}

			throw message.language.get('systemQueryFail');
		}
	]
])
export default class extends RichDisplayCommand {
	public async clan(message: KlasaMessage, [clan]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(message.language.get('systemLoading')).setColor(BrandingColors.Secondary)
		);

		const { items: clanData } = await this.fetchAPI<ClashOfClansFetchCategories.CLANS>(message, clan, ClashOfClansFetchCategories.CLANS);

		if (!clanData.length) throw message.language.get('commandClashOfClansClansQueryFail', { clan });

		const display = await this.buildClanDisplay(message, clanData);

		await display.start(response, message.author.id);
		return response;
	}

	public async player(message: KlasaMessage, [player]: [string]) {
		const playerData = await this.fetchAPI<ClashOfClansFetchCategories.PLAYERS>(message, player, ClashOfClansFetchCategories.PLAYERS);
		return message.send(await this.buildPlayerEmbed(message, playerData));
	}

	private async fetchAPI<C extends ClashOfClansFetchCategories>(message: KlasaMessage, query: string, category: ClashOfClansFetchCategories) {
		try {
			const url = new URL(`https://api.clashofclans.com/v1/${category}/`);

			if (category === ClashOfClansFetchCategories.CLANS) {
				url.searchParams.append('name', query);
				url.searchParams.append('limit', '10');
			} else {
				url.href += encodeURIComponent(query);
			}

			return await fetch<C extends ClashOfClansFetchCategories.CLANS ? ClashOfClans.ClansResponse : ClashOfClans.Player>(
				url,
				{
					headers: {
						Authorization: `Bearer ${TOKENS.CLASH_OF_CLANS_KEY}`
					}
				},
				FetchResultTypes.JSON
			);
		} catch {
			if (category === ClashOfClansFetchCategories.CLANS) throw message.language.get('commandClashOfClansClansQueryFail', { clan: query });
			else throw message.language.get('commandClashofclansPlayersQueryFail', { playertag: query });
		}
	}

	private async buildPlayerEmbed(message: KlasaMessage, player: ClashOfClans.Player) {
		const titles = message.language.get('commandClashofclansPlayerEmbedTitles');

		return new MessageEmbed()
			.setColor(await DbSet.fetchColor(message))
			.setThumbnail(player.league?.iconUrls?.medium ?? '')
			.setAuthor(
				`${player.tag} - ${player.name}`,
				player.clan?.badgeUrls.large ?? '',
				`https://www.clashleaders.com/player/${player.name.toLowerCase().replace(kFilterSpecialCharacters, '-')}-${player.tag
					.slice(1)
					.toLowerCase()}`
			)
			.setDescription(
				[
					`**${titles.xpLevel}**: ${player.expLevel}`,
					`**${titles.builderHallLevel}**: ${player.builderHallLevel}`,
					`**${titles.townhallLevel}**: ${player.townHallLevel}`,
					`**${titles.townhallWeaponLevel}**: ${player.townHallWeaponLevel ?? titles.noTownhallWeaponLevel}`,
					`**${titles.trophies}**: ${player.trophies}`,
					`**${titles.bestTrophies}**: ${player.bestTrophies}`,
					`**${titles.warStars}**: ${player.warStars}`,
					`**${titles.attackWins}**: ${player.attackWins}`,
					`**${titles.defenseWins}**: ${player.defenseWins}`,
					`**${titles.amountOfAchievements}**: ${player.achievements.length}`,
					`**${titles.versusTrophies}**: ${player.versusTrophies}`,
					`**${titles.bestVersusTrophies}**: ${player.bestVersusTrophies}`,
					`**${titles.versusBattleWins}**: ${player.versusBattleWins}`,
					`**${titles.clanRole}**: ${toTitleCase(player.role ?? titles.noRole)}`,
					`**${titles.clanName}**: ${player.clan?.name ?? titles.noClan}`,
					`**${titles.leagueName}**: ${player.league?.name ?? titles.noLeague}`
				].join('\n')
			);
	}

	private async buildClanDisplay(message: KlasaMessage, clans: ClashOfClans.Clan[]) {
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const clan of clans) {
			const titles = message.language.get('commandClashofclansClanEmbedTitles', { isWarLogPublic: clan.isWarLogPublic });
			display.addPage((embed: MessageEmbed) =>
				embed
					.setThumbnail(clan.badgeUrls.large)
					.setTitle(`${clan.tag} - ${clan.name}`)
					.setURL(
						`https://www.clashleaders.com/clan/${clan.name.toLowerCase().replace(kFilterSpecialCharacters, '-')}-${clan.tag
							.slice(1)
							.toLowerCase()}`
					)
					.setDescription(
						[
							`**${titles.clanLevel}**: ${clan.clanLevel}`,
							`**${titles.clanPoints}**: ${clan.clanPoints}`,
							`**${titles.clanVersusPoints}**: ${clan.clanVersusPoints}`,
							`**${titles.amountOfMembers}**: ${clan.members}`,
							clan.description ? `**${titles.description}**: ${clan.description}` : null,
							clan.location
								? `**${titles.locationName}**: ${
										clan.location.isCountry ? `:flag_${clan.location.countryCode.toLowerCase()}:` : ''
								  } ${clan.location.name}`
								: null,
							// Adding TITLES.UNKNOWN in here in case the API changes the designation for war frequency
							`**${titles.warFrequency}**: ${titles.warFrequencyDescr[clan.warFrequency] ?? titles.unknown}`,
							`**${titles.warWinStreak}**: ${clan.warWinStreak}`,
							`**${titles.warWins}**: ${clan.warWins}`,
							`**${titles.warTies}**: ${clan.warTies ?? titles.unknown}`,
							`**${titles.warLosses}**: ${clan.warLosses ?? titles.unknown}`,
							`**${titles.warLogPublic}**: ${titles.warLogPublicDescr}`
						]
							.filter((val) => val !== null)
							.join('\n')
					)
			);
		}

		return display;
	}
}
