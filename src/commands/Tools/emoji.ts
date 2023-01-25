import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { getEncodedTwemoji, getTwemojiUrl } from '#utils/functions';
import { ApplyOptions } from '@sapphire/decorators';
import { TwemojiRegex } from '@sapphire/discord-utilities';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { send } from '@sapphire/plugin-editable-commands';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { Message } from 'discord.js';

const REG_EMOJI = /^<a?:\w{2,32}:\d{17,21}>$/;
const MAX_EMOJI_SIZE = 1024 * 1024 * 8;

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['emote'],
	description: LanguageKeys.Commands.Tools.EmojiDescription,
	detailedDescription: LanguageKeys.Commands.Tools.EmojiExtended,
	requiredClientPermissions: [PermissionFlagsBits.AttachFiles]
})
export class UserCommand extends SkyraCommand {
	public async messageRun(message: Message, args: SkyraCommand.Args) {
		const emoji = await args.pick('string');

		const { content, name, attachment } = REG_EMOJI.test(emoji) ? this.builtinEmoji(args, emoji) : await this.twemoji(args, emoji);
		return send(message, { content, files: [{ attachment, name }] });
	}

	private builtinEmoji(args: SkyraCommand.Args, emoji: string) {
		const [, animated, emojiName, emojiId] = /^<(a)?:(\w{2,32}):(\d{17,21})>$/.exec(emoji)!;
		const content = args.t(LanguageKeys.Commands.Tools.EmojiCustom, { emoji: emojiName, id: emojiId });
		const name = `${emojiId}.${animated ? 'gif' : 'png'}`;
		const attachment = `https://cdn.discordapp.com/emojis/${name}`;

		return { content, name, attachment } as const;
	}

	private async twemoji(args: SkyraCommand.Args, emoji: string) {
		if (!TwemojiRegex.test(emoji)) this.error(LanguageKeys.Commands.Tools.EmojiInvalid);
		const id = getEncodedTwemoji(emoji);

		const attachment = await fetch(getTwemojiUrl(id), FetchResultTypes.Buffer).catch(() => {
			this.error(LanguageKeys.Commands.Tools.EmojiInvalid);
		});
		if (attachment.byteLength >= MAX_EMOJI_SIZE) this.error(LanguageKeys.Commands.Tools.EmojiTooLarge, { emoji });

		const name = `${id}.png`;
		const content = args.t(LanguageKeys.Commands.Tools.EmojiTwemoji, { emoji, id });

		return { content, name, attachment } as const;
	}
}
