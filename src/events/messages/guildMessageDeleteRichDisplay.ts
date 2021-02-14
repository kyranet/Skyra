import { UserPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { Events } from '#lib/types/Enums';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions } from '@sapphire/framework';

@ApplyOptions<EventOptions>({ event: Events.GuildMessageDelete })
export class UserEvent extends Event {
	public run(message: GuildMessage) {
		UserPaginatedMessage.messages.get(message.id)?.collector?.stop();
	}
}
