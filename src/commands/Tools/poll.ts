import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { addReaction } from '#utils/functions';
import { sendLoadingMessage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@skyra/editable-commands';
import type { Message } from 'discord.js';

const NUMBER_OPTS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const ALPHABET_OPTS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹'];

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['spoll'],
	description: LanguageKeys.Commands.Tools.PollDescription,
	extendedHelp: LanguageKeys.Commands.Tools.PollExtended,
	requiredClientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY', 'EMBED_LINKS'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const options = args.nextSplit();
		if (options.length < 2 || options.length > 20) this.error(LanguageKeys.Serializers.MinMaxBothInclusive, { name: 'options', min: 2, max: 20 });

		const emojis = (options.length > 10 ? ALPHABET_OPTS : NUMBER_OPTS).slice(0, options.length);
		const response = await sendLoadingMessage(message, args.t);

		for (const emoji of emojis) {
			if (response.reactions.cache.size === 20) this.error(LanguageKeys.Commands.Tools.PollReactionLimit);
			await addReaction(response, emoji);
		}

		const content = options.map((option, i) => `${emojis[i]} → *${option}*`).join('\n');
		await send(message, { content, allowedMentions: { users: [], roles: [] } });
	}
}
