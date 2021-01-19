import { DbSet, GuildSettings, PartialResponseValue, ResponseType, Task } from '#lib/database';
import { Moderation } from '#utils/constants';
import type { ModerationActionsSendOptions } from '#utils/Security/ModerationActions';
import type { Guild, User } from 'discord.js';

export abstract class ModerationTask<T = unknown> extends Task {
	public async run(data: ModerationData<T>): Promise<PartialResponseValue> {
		const guild = this.context.client.guilds.cache.get(data.guildID);
		// If the guild is not available, cancel the task.
		if (typeof guild === 'undefined') return { type: ResponseType.Ignore };

		// If the guild is not available, re-schedule the task by creating
		// another with the same data but happening 20 seconds later.
		if (!guild.available) return { type: ResponseType.Delay, value: 20000 };

		// Run the abstract handle function.
		try {
			await this.handle(guild, data);
		} catch {
			/* noop */
		}

		return { type: ResponseType.Finished };
	}

	protected async getTargetDM(guild: Guild, target: User): Promise<ModerationActionsSendOptions> {
		return {
			moderator: null,
			send: (await guild.readSettings(GuildSettings.Messages.ModerationDM)) && (await DbSet.fetchModerationDirectMessageEnabled(target.id))
		};
	}

	protected abstract handle(guild: Guild, data: ModerationData<T>): unknown;
}

export interface ModerationData<T = unknown> {
	[Moderation.SchemaKeys.Case]: number;
	[Moderation.SchemaKeys.Guild]: string;
	[Moderation.SchemaKeys.User]: string;
	[Moderation.SchemaKeys.Duration]: number;
	[Moderation.SchemaKeys.ExtraData]: T;
	scheduleRetryCount?: number;
}
