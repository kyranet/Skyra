import { configurableKeys, GuildEntity, GuildSettings, readSettings, writeSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { BrandingColors } from '#utils/constants';
import { addReaction, isAdmin } from '#utils/functions';
import { getImage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { canSendMessages } from '@sapphire/discord.js-utilities';
import { send } from '@skyra/editable-commands';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import { DiscordAPIError, MessageEmbed, TextChannel, User } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Suggestions.SuggestDescription,
	extendedHelp: LanguageKeys.Commands.Suggestions.SuggestExtended,
	requiredClientPermissions: ['EMBED_LINKS'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const [suggestionsChannelId, upVoteEmoji, downVoteEmoji] = await readSettings(message.guild, [
			GuildSettings.Suggestions.Channel,
			GuildSettings.Suggestions.VotingEmojis.UpVoteEmoji,
			GuildSettings.Suggestions.VotingEmojis.DownVoteEmoji
		]);

		const suggestionsChannel = this.container.client.channels.cache.get(suggestionsChannelId ?? '') as TextChannel | undefined;
		if (!suggestionsChannel) {
			this.error(LanguageKeys.Commands.Suggestions.SuggestNoSetup, { username: message.author.username });
		}

		if (!canSendMessages(suggestionsChannel)) {
			this.error(LanguageKeys.Commands.Suggestions.SuggestNoPermissions, {
				username: message.author.username,
				channel: message.channel.toString()
			});
		}

		const { author, suggestionContent, image } = await this.resolveArguments(args);
		const [suggestions, currentSuggestionId] = await this.getCurrentSuggestionId(message.guild.id);

		// Post the suggestion
		const embed = new MessageEmbed()
			.setColor(BrandingColors.Primary)
			.setAuthor(`${author.tag} (${author.id})`, author.displayAvatarURL({ format: 'png', size: 128, dynamic: true }))
			.setTitle(args.t(LanguageKeys.Commands.Suggestions.SuggestTitle, { id: currentSuggestionId + 1 }))
			.setDescription(suggestionContent);
		if (image !== null) embed.setImage(image);

		const suggestionsMessage = (await suggestionsChannel.send({ embeds: [embed] })) as GuildMessage;

		// Commit the suggestion to the DB
		await suggestions.insert({
			id: currentSuggestionId + 1,
			authorId: author.id,
			guildId: message.guild.id,
			messageId: suggestionsMessage.id
		});

		// Add the up-vote/down-vote reactions
		await this.react(suggestionsMessage, upVoteEmoji, GuildSettings.Suggestions.VotingEmojis.UpVoteEmoji);
		await this.react(suggestionsMessage, downVoteEmoji, GuildSettings.Suggestions.VotingEmojis.DownVoteEmoji);

		const content = args.t(LanguageKeys.Commands.Suggestions.SuggestSuccess, { channel: suggestionsChannel.toString() });
		return send(message, content);
	}

	private async react(message: GuildMessage, emoji: string, path: keyof GuildEntity) {
		try {
			await addReaction(message, emoji);
		} catch (error) {
			// If it's not a DiscordAPIError, throw:
			if (!(error instanceof DiscordAPIError)) throw error;

			// If it's not an UnknownEmoji error, throw:
			if (error.code !== RESTJSONErrorCodes.UnknownEmoji) throw error;

			// If it's the default value, throw:
			const defaultEmoji = configurableKeys.get(path)!.default as string;
			if (emoji === defaultEmoji) throw error;

			await addReaction(message, defaultEmoji);
			await writeSettings(message.guild, [[path, defaultEmoji]]);
		}
	}

	private async resolveArguments(args: SkyraCommand.Args): Promise<ResolvedArguments> {
		// If the user is not an administrator, they cannot create suggestions on behalf of other users:
		if (!(await isAdmin(args.message.member!))) return this.resolveStringContent(args);

		// Administrator fallback, try message, then fallback to rest string if it fails:
		try {
			const message = await args.pick('message');
			return { author: message.author, suggestionContent: message.content, image: getImage(message) };
		} catch {
			return this.resolveStringContent(args);
		}
	}

	private async resolveStringContent(args: SkyraCommand.Args): Promise<ResolvedArguments> {
		const suggestion = await args.rest('string');
		return { author: args.message.author, suggestionContent: suggestion, image: getImage(args.message) };
	}

	private async getCurrentSuggestionId(guildId: string) {
		const { suggestions } = this.container.db;

		// Retrieve the ID for the latest suggestion
		const [{ max }] = (await suggestions.query(
			/* sql */ `
			SELECT max(id)
			FROM "${suggestions.metadata.tableName}"
			WHERE guild_id = $1;
		`,
			[guildId]
		)) as [MaxQuery];

		return [suggestions, max ?? 0] as const;
	}
}

interface MaxQuery {
	max: number | null;
}

interface ResolvedArguments {
	author: User;
	suggestionContent: string;
	image: string | null;
}
