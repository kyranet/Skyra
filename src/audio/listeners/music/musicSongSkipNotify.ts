import { AudioListener, QueueEntry } from '#lib/audio';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { MessageAcknowledgeable } from '#lib/types';

export class UserAudioListener extends AudioListener {
	public async run(channel: MessageAcknowledgeable, entry: QueueEntry) {
		const track = await channel.guild.audio.player.node.decode(entry.track);
		await channel.sendTranslated(LanguageKeys.Commands.Music.SkipSuccess, [{ title: track.title }], {
			allowedMentions: { users: [], roles: [] }
		});
	}
}
