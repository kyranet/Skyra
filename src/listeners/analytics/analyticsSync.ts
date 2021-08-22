import type { DbSet } from '#lib/database';
import { AnalyticsListener } from '#lib/structures';
import { Actions, EconomyType, EconomyValueType, Points, Tags } from '#lib/types/AnalyticsSchema';
import { Events } from '#lib/types/Enums';
import { Point } from '@influxdata/influxdb-client';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<AnalyticsListener.Options>({ event: Events.AnalyticsSync })
export class UserAnalyticsEvent extends AnalyticsListener {
	public async run(guilds: number, users: number) {
		const dbSet = this.container.db;
		const [economyHealth, twitchSubscriptionCount] = await Promise.all([this.fetchEconomyHealth(dbSet), dbSet.twitchSubscriptions.count()]);

		this.writePoints([
			this.syncGuilds(guilds),
			this.syncUsers(users),
			this.syncVoiceConnections(),
			this.syncEconomy(economyHealth.total_money, EconomyType.Money),
			this.syncEconomy(economyHealth.total_vault, EconomyType.Vault),
			this.syncTwitchSubscriptions(twitchSubscriptionCount),
			this.syncMessageCount()
		]);

		return this.container.client.analytics!.writeApi.flush();
	}

	private syncGuilds(value: number) {
		return (
			new Point(Points.Guilds)
				.tag(Tags.Action, Actions.Sync)
				// TODO: Adjust for traditional sharding
				.intField('value', value)
		);
	}

	private syncUsers(value: number) {
		return (
			new Point(Points.Users)
				.tag(Tags.Action, Actions.Sync)
				// TODO: Adjust for traditional sharding
				.intField('value', value)
		);
	}

	private syncVoiceConnections() {
		return (
			new Point(Points.VoiceConnections)
				.tag(Tags.Action, Actions.Sync)
				// TODO: Adjust for traditional sharding
				.intField('value', this.container.client.audio?.queues.reduce((acc, queue) => (queue.player.playing ? acc + 1 : acc), 0) ?? 0)
		);
	}

	private syncEconomy(value: string, type: EconomyType) {
		return new Point(Points.Economy) //
			.tag(Tags.Action, Actions.Sync)
			.tag(Tags.ValueType, EconomyValueType.Size)
			.intField(type, Number(value));
	}

	private syncTwitchSubscriptions(value: number) {
		return new Point(Points.TwitchSubscriptions) //
			.tag(Tags.Action, Actions.Sync)
			.intField('count', value);
	}

	private syncMessageCount() {
		const { client } = this.container;
		const value = client.analytics!.messageCount;
		client.analytics!.messageCount = 0;

		return new Point(Points.MessageCount) //
			.tag(Tags.Action, Actions.Sync)
			.intField('value', value);
	}

	private async fetchEconomyHealth(dbSet: DbSet): Promise<{ total_money: string; total_vault: string }> {
		const [data] = await dbSet.users.query(/* sql */ `
			WITH
				u AS (SELECT SUM(money) as total_money FROM public.user),
				v AS (SELECT SUM(vault) as total_vault FROM public.user_profile)
			SELECT * FROM u, v;
		`);
		return data;
	}
}
