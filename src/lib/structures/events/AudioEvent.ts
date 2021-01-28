import type { OutgoingWebsocketMessage } from '#lib/websocket/types';
import { ENABLE_LAVALINK } from '#root/config';
import { Event, EventOptions, PieceContext } from '@sapphire/framework';

interface AudioBroadcastCallback {
	(): OutgoingWebsocketMessage | Promise<OutgoingWebsocketMessage>;
}

export abstract class AudioEvent extends Event {
	public constructor(context: PieceContext, options: AudioEvent.Options = {}) {
		super(context, { ...options, enabled: ENABLE_LAVALINK });
	}

	public *getWebSocketListenersFor(guildID: string) {
		for (const user of this.context.client.websocket.users.values()) {
			if (user.musicSubscriptions.subscribed(guildID)) yield user;
		}
	}

	public async broadcastMessageForGuild(guildID: string, cb: AudioBroadcastCallback) {
		const iterator = this.getWebSocketListenersFor(guildID);

		// Retrieve the first result:
		const firstResult = iterator.next();
		if (firstResult.done) return false;

		// Retrieve the data and send it to the first value:
		const data = await cb();
		firstResult.value.send(data);

		// Iterate over the rest of subscribers:
		for (const subscription of iterator) {
			subscription.send(data);
		}

		return true;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AudioEvent {
	export type Options = EventOptions;
}
