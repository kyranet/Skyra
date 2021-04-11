import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { RESTJSONErrorCodes } from 'discord-api-types/common';
import { DiscordAPIError, Message } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	cooldown: 5,
	description: LanguageKeys.Commands.Tools.VoteDescription,
	extendedHelp: LanguageKeys.Commands.Tools.VoteExtended,
	permissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY']
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		if (args.finished) this.error(LanguageKeys.Commands.Tools.VoteContentNeeded);

		for (const reaction of ['👍', '👎', '🤷']) {
			if (!message.reactions.cache.has(reaction)) await this.react(message, reaction);
		}

		return message;
	}

	private async react(message: Message, reaction: string) {
		try {
			await message.react(reaction);
		} catch (error) {
			if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.ReactionWasBlocked) {
				this.error(LanguageKeys.Commands.Tools.VoteReactionBlocked);
			}
			throw error;
		}
	}
}
