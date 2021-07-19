import { GuildSettings, readSettings, SuggestionEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import type { SuggestionData } from '#lib/types/definitions/Suggestion';
import { PermissionLevels } from '#lib/types/Enums';
import { resolveOnErrorCodes } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Args, Store } from '@sapphire/framework';
import { RESTJSONErrorCodes } from 'discord-api-types/v6';
import { MessageEmbed, TextChannel } from 'discord.js';

const enum SuggestionsColors {
	Accepted = 0x4cb02c,
	Considered = 0xcfa08d,
	Denied = 0xf90505
}

type Actions = 'accept' | 'a' | 'deny' | 'd' | 'consider' | 'c';
const kActions: readonly Actions[] = ['accept', 'a', 'deny', 'd', 'consider', 'c'];

const minimum = 1;
const maximum = 2_147_483_647; // Maximum value for int32

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['resu'],
	cooldown: 10,
	description: LanguageKeys.Commands.Suggestions.ResolveSuggestionDescription,
	extendedHelp: LanguageKeys.Commands.Suggestions.ResolveSuggestionExtended,
	strategyOptions: { flags: ['show-author', 'showAuthor', 'hide-author', 'hideAuthor'] },
	permissionLevel: PermissionLevels.Moderator,
	permissions: ['EMBED_LINKS'],
	runIn: ['text', 'news']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const suggestionData = await args.pick(UserCommand.suggestion);
		const action = await args.pick(UserCommand.action);
		const comment = args.finished ? args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionDefaultComment) : await args.rest('string');

		const [shouldDM, shouldHideAuthor, shouldRePostSuggestion] = await readSettings(message.guild, [
			GuildSettings.Suggestions.OnAction.DM,
			GuildSettings.Suggestions.OnAction.HideAuthor,
			GuildSettings.Suggestions.OnAction.RePostMessage
		]);
		const [suggestion] = suggestionData.message.embeds;

		let newEmbed = new MessageEmbed();
		let messageContent = '';

		const author = await this.getAuthor(message, shouldHideAuthor, args);

		const actions = args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionActions, { author });
		const DMActions = args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionActionsDms, { author, guild: message.guild.name });

		switch (action) {
			case 'a':
			case 'accept':
				messageContent = DMActions.accept;
				newEmbed = suggestion.setColor(SuggestionsColors.Accepted).addField(actions.accept, comment);
				break;
			case 'c':
			case 'consider':
				messageContent = DMActions.consider;
				newEmbed = suggestion.setColor(SuggestionsColors.Considered).addField(actions.consider, comment);
				break;
			case 'd':
			case 'deny':
				messageContent = DMActions.deny;
				newEmbed = suggestion.setColor(SuggestionsColors.Denied).addField(actions.deny, comment);
				break;
		}

		if (shouldDM && messageContent !== null) {
			try {
				await suggestionData.author!.send(messageContent, { embed: newEmbed });
			} catch {
				await message.send(args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionDmFail));
			}
		}

		if (shouldRePostSuggestion) {
			await suggestionData.message.send(messageContent, { embed: newEmbed });
		} else if (suggestionData.message.author.id === process.env.CLIENT_ID) {
			await suggestionData.message.edit(newEmbed);
		}

		const actionText =
			action === 'a' || action === 'accept'
				? args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionSuccessAcceptedText)
				: action === 'd' || action === 'deny'
				? args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionSuccessDeniedText)
				: args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionSuccessConsideredText);

		return message.send(args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionSuccess, { id: suggestionData.id, actionText }));
	}

	private async getAuthor(message: GuildMessage, hideAuthor: boolean, args: SkyraCommand.Args) {
		if (args.getFlags('show-author', 'showAuthor')) return message.author.tag;
		if (args.getFlags('hide-author', 'hideAuthor') || hideAuthor) {
			return (await message.member.isAdmin())
				? args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionAuthorAdmin)
				: args.t(LanguageKeys.Commands.Suggestions.ResolveSuggestionAuthorModerator);
		}
		return message.author.tag;
	}

	private static suggestion = Args.make<SuggestionData>(async (parameter, { args, argument, message }) => {
		// Validate the suggestions channel ID
		const channelID = await readSettings(message.guild!, GuildSettings.Suggestions.Channel);
		if (!channelID) {
			return Args.error({
				argument,
				parameter,
				identifier: LanguageKeys.Commands.Suggestions.SuggestNoSetup,
				context: { username: message.author.username }
			});
		}

		let suggestionData: SuggestionEntity | undefined;
		if (args.t(LanguageKeys.Arguments.CaseLatestOptions).includes(parameter.toLowerCase())) {
			// Retrieve latest entry
			const { suggestions } = Store.injectedContext.db;
			suggestionData = await suggestions.findOne({ order: { id: 'DESC' }, where: { guildID: message.guild!.id } });
		} else {
			// Validate the suggestion number
			const id = Number(parameter);
			if (!Number.isInteger(id) || id < minimum || id > maximum) {
				return Args.error({
					argument,
					parameter,
					identifier: LanguageKeys.Commands.Suggestions.ResolveSuggestionInvalidID,
					context: { minimum, maximum }
				});
			}

			// Retrieve the suggestion data
			const { suggestions } = Store.injectedContext.db;
			suggestionData = await suggestions.findOne({ id, guildID: message.guild!.id });
		}

		if (!suggestionData) {
			return Args.error({ argument, parameter, identifier: LanguageKeys.Commands.Suggestions.ResolveSuggestionIDNotFound });
		}

		const channel = message.client.channels.cache.get(channelID) as TextChannel;
		const suggestionMessage = await resolveOnErrorCodes(channel.messages.fetch(suggestionData.messageID), RESTJSONErrorCodes.UnknownMessage);
		if (suggestionMessage === null) {
			await suggestionData.remove();
			return Args.error({ argument, parameter, identifier: LanguageKeys.Commands.Suggestions.ResolveSuggestionMessageNotFound });
		}

		const suggestionAuthor = await message.client.users.fetch(suggestionData.authorID).catch(() => null);
		return Args.ok({ message: suggestionMessage, author: suggestionAuthor, id: suggestionData.id });
	});

	private static action = Args.make<Actions>(async (parameter, { argument }) => {
		const lowerCase = parameter.toLowerCase() as Actions;
		if (kActions.includes(lowerCase)) return Args.ok(lowerCase);
		return Args.error({ argument, parameter, identifier: LanguageKeys.Commands.Suggestions.ResolveSuggestionInvalidAction });
	});
}
