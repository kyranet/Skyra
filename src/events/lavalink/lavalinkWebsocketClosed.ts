import { MusicHandler } from '@lib/structures/music/MusicHandler';
import { Events } from '@lib/types/Enums';
import { LavalinkWebSocketClosedEvent } from '@utils/LavalinkUtils';
import { Colors, Event } from 'klasa';

export default class extends Event {

	private kHeader = new Colors({ text: 'magenta' }).format('[LAVALINK]');

	public run(manager: MusicHandler, payload: LavalinkWebSocketClosedEvent) {
		if (payload.code >= 4000) {
			this.client.emit(Events.Error, [
				`${this.kHeader} Websocket Close (${manager.guild.id})`,
				`           Code  : ${payload.code}`,
				`           Reason: ${payload.reason}`
			]);
		}

		manager.reset(true);
	}

}
