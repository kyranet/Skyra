import { DbSet } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { PaginatedMessageCommand, UserPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { FFXIV } from '#lib/types/definitions/FFXIVTypings';
import { FFXIVClasses, FFXIV_BASE_URL, getCharacterDetails, searchCharacter, searchItem, SubCategoryEmotes } from '#utils/APIs/FFXIVUtils';
import { ZeroWidthSpace } from '#utils/constants';
import { sendLoadingMessage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { EmbedField, MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<PaginatedMessageCommand.Options>({
	aliases: ['finalfantasy'],
	cooldown: 10,
	description: LanguageKeys.Commands.GameIntegration.FFXIVDescription,
	extendedHelp: LanguageKeys.Commands.GameIntegration.FFXIVExtended,
	strategyOptions: {
		options: ['server']
	},
	subCommands: ['item', { input: 'character', default: true }]
})
export class UserPaginatedMessageCommand extends PaginatedMessageCommand {
	public async character(message: GuildMessage, args: PaginatedMessageCommand.Args) {
		const name = await args.rest('string');
		const { t } = args;
		const response = await sendLoadingMessage(message, t);

		const characterDetails = await this.fetchCharacter(t, name, args.getOption('server') ?? undefined);
		const display = await this.buildCharacterDisplay(message, t, characterDetails.Character);

		await display.start(response as GuildMessage, message.author);
		return response;
	}

	public async item(message: GuildMessage, args: PaginatedMessageCommand.Args) {
		const item = await args.rest('string');
		const { t } = args;
		const response = await sendLoadingMessage(message, t);

		const itemDetails = await this.fetchItems(t, item);
		const display = await this.buildItemDisplay(message, t, itemDetails);

		await display.start(response as GuildMessage, message.author);

		return response;
	}

	private async fetchCharacter(t: TFunction, name: string, server?: string) {
		const searchResult = await searchCharacter(t, name, server);

		if (!searchResult.Results.length) throw t(LanguageKeys.Commands.GameIntegration.FFXIVNoCharacterFound);

		return getCharacterDetails(t, searchResult.Results[0].ID);
	}

	private async fetchItems(t: TFunction, item: string) {
		const searchResult = await searchItem(t, item);

		if (!searchResult.Results.length) throw t(LanguageKeys.Commands.GameIntegration.FFXIVNoItemFound);

		return searchResult.Results;
	}

	private async buildCharacterDisplay(message: GuildMessage, t: TFunction, character: FFXIV.Character) {
		const {
			discipleOfTheHandJobs,
			discipleOfTheLandJobs,
			healerClassValues,
			magRangedDPSClassValues,
			meleeDPSClassValues,
			phRangedDPSClassValues,
			tankClassValues
		} = this.parseCharacterClasses(character.ClassJobs);

		const titles = t(LanguageKeys.Commands.GameIntegration.FFXIVCharacterFields);

		const display = new UserPaginatedMessage({
			template: new MessageEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setAuthor(character.Name, character.Avatar, `https://eu.finalfantasyxiv.com/lodestone/character/${character.ID}/`)
		}).addPageEmbed((embed) =>
			embed
				.setThumbnail(character.Avatar)
				.setImage(character.Portrait)
				.addField(titles.serverAndDc, [character.Server, character.DC].join(' - '), true)
				.addField(titles.tribe, character.Tribe.Name, true)
				.addField(titles.characterGender, character.GenderID === 1 ? `${titles.male}` : `${titles.female}`, true)
				.addField(titles.nameday, character.Nameday, true)
				.addField(titles.guardian, character.GuardianDeity.Name, true)
				.addField(titles.cityState, character.Town.Name, true)
				.addField(titles.grandCompany, character.GrandCompany.Company?.Name || titles.none, true)
				.addField(titles.rank, character.GrandCompany.Rank?.Name || titles.none, true)
				.addField(ZeroWidthSpace, ZeroWidthSpace, true)
		);

		if (
			tankClassValues.length ||
			healerClassValues.length ||
			meleeDPSClassValues.length ||
			phRangedDPSClassValues.length ||
			magRangedDPSClassValues.length
		) {
			display.addPageEmbed((embed) => {
				embed.setTitle(titles.dowDomClasses);

				if (tankClassValues.length) embed.addField(`${SubCategoryEmotes.Tank} ${titles.tank}`, tankClassValues.join('\n'), true);
				if (healerClassValues.length) embed.addField(`${SubCategoryEmotes.Healer} ${titles.healer}`, healerClassValues.join('\n'), true);
				if (meleeDPSClassValues.length) embed.addField(`${SubCategoryEmotes.Melee} ${titles.meleeDps}`, meleeDPSClassValues.join('\n'), true);
				if (phRangedDPSClassValues.length)
					embed.addField(`${SubCategoryEmotes.phRange} ${titles.physicalRangedDps}`, phRangedDPSClassValues.join('\n'), true);
				if (magRangedDPSClassValues.length)
					embed.addField(`${SubCategoryEmotes.magRange} ${titles.magicalRangedDps}`, magRangedDPSClassValues.join('\n'), true);
				return embed;
			});
		}

		if (discipleOfTheHandJobs.length) {
			display.addPageEmbed((embed) => {
				embed.fields = discipleOfTheHandJobs;
				embed.setTitle(titles.dohClasses).addField(ZeroWidthSpace, ZeroWidthSpace, true);
				return embed;
			});
		}

		if (discipleOfTheLandJobs.length) {
			display.addPageEmbed((embed) => {
				embed.fields = discipleOfTheLandJobs;
				embed.setTitle(titles.dolClasses);
				return embed;
			});
		}

		return display;
	}

	private async buildItemDisplay(message: GuildMessage, t: TFunction, items: FFXIV.ItemSearchResult[]) {
		const titles = t(LanguageKeys.Commands.GameIntegration.FFXIVItemFields);
		const display = new UserPaginatedMessage({ template: new MessageEmbed().setColor(await DbSet.fetchColor(message)) });

		for (const item of items) {
			display.addPageEmbed((embed) =>
				embed
					.setDescription(item.Description.split('\n')[0])
					.setAuthor(item.Name, `${FFXIV_BASE_URL}${item.Icon}`)
					.setThumbnail(`${FFXIV_BASE_URL}${item.Icon}`)
					.addField(titles.kind, item.ItemKind.Name, true)
					.addField(titles.category, item.ItemSearchCategory.Name || titles.none, true)
					.addField(titles.levelEquip, item.LevelEquip, true)
			);
		}

		return display;
	}

	private parseCharacterClasses(classJobs: FFXIV.ClassJob[]) {
		const discipleOfTheHandJobs: EmbedField[] = [];
		const discipleOfTheLandJobs: EmbedField[] = [];
		const tankClassValues: string[] = [];
		const healerClassValues: string[] = [];
		const meleeDPSClassValues: string[] = [];
		const phRangedDPSClassValues: string[] = [];
		const magRangedDPSClassValues: string[] = [];

		for (const classJob of classJobs) {
			const classDetails = FFXIVClasses.get(classJob.Job.Abbreviation)!;

			switch (classDetails.subcategory) {
				case FFXIV.ClassSubcategory.DoH:
					discipleOfTheHandJobs.push({
						name: `${classDetails.emote} ${classDetails.fullName}`,
						value: classJob.Level.toString(),
						inline: true
					});
					break;
				case FFXIV.ClassSubcategory.DoL:
					discipleOfTheLandJobs.push({
						name: `${classDetails.emote} ${classDetails.fullName}`,
						value: classJob.Level.toString(),
						inline: true
					});
					break;
				case FFXIV.ClassSubcategory.Tank:
					tankClassValues.push(`${classDetails.emote} **${classDetails.fullName}**: ${classJob.Level}`);
					break;
				case FFXIV.ClassSubcategory.Healer:
					healerClassValues.push(`${classDetails.emote} **${classDetails.fullName}**: ${classJob.Level}`);
					break;
				case FFXIV.ClassSubcategory.MDPS:
					meleeDPSClassValues.push(`${classDetails.emote} **${classDetails.fullName}**: ${classJob.Level}`);
					break;
				case FFXIV.ClassSubcategory.PRDPS:
					phRangedDPSClassValues.push(`${classDetails.emote} **${classDetails.fullName}**: ${classJob.Level}`);
					break;
				case FFXIV.ClassSubcategory.MRDPS:
					magRangedDPSClassValues.push(`${classDetails.emote} **${classDetails.fullName}**: ${classJob.Level}`);
					break;
			}
		}

		return {
			discipleOfTheHandJobs,
			discipleOfTheLandJobs,
			tankClassValues,
			healerClassValues,
			meleeDPSClassValues,
			phRangedDPSClassValues,
			magRangedDPSClassValues
		};
	}
}
