import type { Queue } from '#lib/audio';
import { AudioEvent } from '#lib/structures';
import { OutgoingWebsocketAction } from '#lib/websocket/types';

export class UserAudioEvent extends AudioEvent {
	public run(queue: Queue, next: number) {
		return this.broadcastMessageForGuild(queue.guildID, () => ({
			action: OutgoingWebsocketAction.MusicSongVolumeUpdate,
			data: { volume: next }
		}));
	}
}
