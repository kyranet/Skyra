import { AudioListener, QueueEntry } from '#lib/audio';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { MessageAcknowledgeable } from '#lib/types';

export class UserAudioListener extends AudioListener {
	public async run(channel: MessageAcknowledgeable, entry: QueueEntry) {
		const [title, requester] = await Promise.all([
			channel.guild.audio.player.node.decode(entry.track).then((data) => data.title),
			this.container.client.users.fetch(entry.author).then((data) => data.username)
		]);
		await channel.sendTranslated(LanguageKeys.Commands.Music.RemoveSuccess, [{ title, requester }], {
			allowedMentions: { users: [], roles: [] }
		});
	}
}
