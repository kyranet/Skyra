import { envIsDefined } from '#lib/env';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { PaginatedMessageCommand, SkyraPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { IMAGE_EXTENSION, sendLoadingMessage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { MimeTypes } from '@sapphire/plugin-api';
import { cutText, parseURL, toTitleCase } from '@sapphire/utilities';
import { MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<PaginatedMessageCommand.Options>({
	enabled: envIsDefined('OWLBOT_TOKEN'),
	aliases: ['def', 'definition', 'defination', 'dictionary'],
	description: LanguageKeys.Commands.Tools.DefineDescription,
	detailedDescription: LanguageKeys.Commands.Tools.DefineExtended
})
export class UserPaginatedMessageCommand extends PaginatedMessageCommand {
	public async run(message: GuildMessage, args: PaginatedMessageCommand.Args) {
		const input = await args.rest('string');
		const response = await sendLoadingMessage(message, args.t);

		const result = await this.fetchApi(input);
		const display = await this.buildDisplay(result, message, args.t);

		await display.run(response, message.author);
		return response;
	}

	private async buildDisplay(results: OwlbotResultOk, message: GuildMessage, t: TFunction) {
		const template = new MessageEmbed()
			.setTitle(toTitleCase(results.word))
			.setColor(await this.container.db.fetchColor(message))
			.setFooter(' - Powered by Owlbot');

		if (results.pronunciation) template.addField(t(LanguageKeys.Commands.Tools.DefinePronunciation), results.pronunciation, true);

		const display = new SkyraPaginatedMessage({ template });

		for (const result of results.definitions) {
			const definition = this.content(result.definition);
			display.addPageEmbed((embed) => {
				embed
					.addField('Type', result.type ? toTitleCase(result.type) : t(LanguageKeys.Commands.Tools.DefineUnknown), true)
					.setDescription(definition);

				const imageUrl = IMAGE_EXTENSION.test(result.image_url ?? '') && parseURL(result.image_url ?? '');
				if (imageUrl) embed.setThumbnail(imageUrl.toString());

				return embed;
			});
		}

		return display;
	}

	private async fetchApi(word: string) {
		try {
			return await fetch<OwlbotResultOk>(
				`https://owlbot.info/api/v4/dictionary/${encodeURIComponent(word.toLowerCase())}`,
				{ headers: { Accept: MimeTypes.ApplicationJson, Authorization: `Token ${process.env.OWLBOT_TOKEN}` } },
				FetchResultTypes.JSON
			);
		} catch {
			this.error(LanguageKeys.Commands.Tools.DefineNotFound);
		}
	}

	private content(definition: string) {
		if (definition.length < 2048) return definition;
		return cutText(definition, 2048);
	}
}

export interface OwlbotResultOk {
	definitions: readonly OwlbotDefinition[];
	word: string;
	pronunciation: string | null;
}

export interface OwlbotDefinition {
	type: string | null;
	definition: string;
	example: string | null;
	image_url: string | null;
	emoji: string | null;
}
