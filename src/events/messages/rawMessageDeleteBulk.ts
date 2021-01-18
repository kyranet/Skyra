import { Events } from '#lib/types/Enums';
import { ApplyOptions } from '@sapphire/decorators';
import { GatewayDispatchEvents, GatewayMessageDeleteBulkDispatch } from 'discord-api-types/v6';
import { Event, EventOptions } from 'klasa';

@ApplyOptions<EventOptions>({ event: GatewayDispatchEvents.MessageDeleteBulk, emitter: 'ws' })
export default class extends Event {
	public run(data: GatewayMessageDeleteBulkDispatch['d']): void {
		if (!data.guild_id) return;

		const guild = this.context.client.guilds.cache.get(data.guild_id);
		if (!guild || !guild.channels.cache.has(data.channel_id)) return;

		this.context.client.emit(Events.RawMessageDeleteBulk, guild, data);
	}
}
