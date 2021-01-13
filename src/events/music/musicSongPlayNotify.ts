import { NowPlayingEntry } from '#lib/audio';
import { AudioEvent } from '#lib/structures/events/AudioEvent';
import { MessageAcknowledgeable } from '#lib/types';
import { LanguageKeys } from '#lib/i18n/languageKeys';

export default class extends AudioEvent {
	public async run(channel: MessageAcknowledgeable, entry: NowPlayingEntry) {
		const requester = await this.client.users.fetch(entry.author).then((data) => data.username);
		const { title } = entry.info;

		await channel.sendTranslated(LanguageKeys.Commands.Music.PlayNext, [{ title, requester }], {
			allowedMentions: { users: [], roles: [] }
		});
	}
}
