import { MusicHandler, MusicHandlerRequestContext } from '@lib/structures/music/MusicHandler';
import { OutgoingWebsocketAction } from '@lib/websocket/types';
import { floatPromise } from '@utils/util';
import { Event } from 'klasa';

export default class extends Event {
	public run(manager: MusicHandler, previous: number, next: number, context: MusicHandlerRequestContext | null) {
		const channel = context ? context.channel : manager.channel;

		if (channel) {
			const { language } = channel.guild;
			const response =
				next > 200
					? language.tget('COMMAND_VOLUME_CHANGED_EXTREME', '📢', language.tget('COMMAND_VOLUME_CHANGED_TEXTS'), next)
					: language.tget('COMMAND_VOLUME_CHANGED', next > previous ? (next === 200 ? '📢' : '🔊') : next === 0 ? '🔇' : '🔉', next);
			floatPromise(this, channel.sendMessage(response));
		}

		for (const subscription of manager.websocketUserIterator()) {
			subscription.send({ action: OutgoingWebsocketAction.MusicSongVolumeUpdate, data: { volume: next } });
		}
	}
}
