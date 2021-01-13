import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { Message } from 'discord.js';
import { Event } from 'klasa';

export default class extends Event {
	public async run(message: Message) {
		await message.alert(await message.resolveKey(LanguageKeys.Monitors.NoMentionSpamAlert));
	}
}
