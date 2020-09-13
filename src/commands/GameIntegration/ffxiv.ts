import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { FFXIV } from '@utils/GameIntegration/FFXIVTypings';
import { FFXIVClasses, FFXIV_BASE_URL, getCharacterDetails, searchCharacter, searchItem, SubCategoryEmotes } from '@utils/GameIntegration/FFXIVUtils';
import { pickRandom } from '@utils/util';
import { EmbedField, MessageEmbed } from 'discord.js';
import { KlasaMessage, Language } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['finalfantasy'],
	cooldown: 10,
	description: (language) => language.get('commandFFXIVDescription'),
	extendedHelp: (language) => language.get('commandFFXIVExtended'),
	flagSupport: true,
	subcommands: true,
	usage: '(item|character:default) <search:...string> ',
	usageDelim: ' '
})
export default class extends RichDisplayCommand {
	public async character(message: KlasaMessage, [name]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get('systemLoading'))).setColor(BrandingColors.Secondary)
		);

		const characterDetails = await this.fetchCharacter(message.language, name, Reflect.get(message.flagArgs, 'server'));
		const display = await this.buildCharacterDisplay(message, characterDetails.Character);

		await display.start(response, message.author.id);
		return response;
	}

	public async item(message: KlasaMessage, [item]: [string]) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(pickRandom(message.language.get('systemLoading'))).setColor(BrandingColors.Secondary)
		);

		const itemDetails = await this.fetchItems(message.language, item);
		const display = await this.buildItemDisplay(message, itemDetails);

		await display.start(response, message.author.id);

		return response;
	}

	private async fetchCharacter(i18n: Language, name: string, server?: string) {
		const searchResult = await searchCharacter(i18n, name, server);

		if (!searchResult.Results.length) throw i18n.get('commandFFXIVNoCharacterFound');

		return getCharacterDetails(i18n, searchResult.Results[0].ID);
	}

	private async fetchItems(i18n: Language, item: string) {
		const searchResult = await searchItem(i18n, item);

		if (!searchResult.Results.length) throw i18n.get('commandFFXIVNoItemFound');

		return searchResult.Results;
	}

	private async buildCharacterDisplay(message: KlasaMessage, character: FFXIV.Character) {
		const {
			discipleOfTheHandJobs,
			discipleOfTheLandJobs,
			healerClassValues,
			magRangedDPSClassValues,
			meleeDPSClassValues,
			phRangedDPSClassValues,
			tankClassValues
		} = this.parseCharacterClasses(character.ClassJobs);

		const titles = message.language.get('commandFFXIVCharacterFields');

		const display = new UserRichDisplay(
			new MessageEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setAuthor(character.Name, character.Avatar, `https://eu.finalfantasyxiv.com/lodestone/character/${character.ID}/`)
		).addPage((embed: MessageEmbed) =>
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
				.addBlankField(true)
		);

		if (
			tankClassValues.length ||
			healerClassValues.length ||
			meleeDPSClassValues.length ||
			phRangedDPSClassValues.length ||
			magRangedDPSClassValues.length
		) {
			display.addPage((embed: MessageEmbed) => {
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
			display.addPage((embed: MessageEmbed) => {
				embed.fields = discipleOfTheHandJobs;
				embed.setTitle(titles.dohClasses).addBlankField(true);
				return embed;
			});
		}

		if (discipleOfTheLandJobs.length) {
			display.addPage((embed: MessageEmbed) => {
				embed.fields = discipleOfTheLandJobs;
				embed.setTitle(titles.dolClasses);
				return embed;
			});
		}

		return display;
	}

	private async buildItemDisplay(message: KlasaMessage, items: FFXIV.ItemSearchResult[]) {
		const titles = message.language.get('commandFFXIVItemFields');
		const display = new UserRichDisplay(new MessageEmbed().setColor(await DbSet.fetchColor(message)));

		for (const item of items) {
			display.addPage((embed: MessageEmbed) =>
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
