import { AudioListener, NowPlayingEntry } from '#lib/audio';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { MessageAcknowledgeable } from '#lib/types';

export class UserAudioListener extends AudioListener {
	public async run(channel: MessageAcknowledgeable, entry: NowPlayingEntry) {
		const requester = await this.container.client.users.fetch(entry.author).then((data) => data.username);
		const { title } = entry.info;

		await channel.sendTranslated(LanguageKeys.Commands.Music.PlayNext, [{ title, requester }], {
			allowedMentions: { users: [], roles: [] }
		});
	}
}
