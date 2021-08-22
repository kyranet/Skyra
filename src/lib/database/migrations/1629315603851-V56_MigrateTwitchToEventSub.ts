import { TwitchEventSubTypes } from '#lib/types/definitions/Twitch';
import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from 'typeorm';
import { Twitch } from '#lib/util/Notifications/Twitch';

export class V56MigrateTwitchToEventSub1629315603851 implements MigrationInterface {
	private twitch = new Twitch();

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			/* sql */ `CREATE TYPE "public"."twitch_subscriptions_subscription_type_enum" AS ENUM('stream.online', 'stream.offline');`
		);

		await queryRunner.createTable(
			new Table({
				name: 'twitch_subscriptions',
				uniques: [
					new TableUnique({
						name: 'streamer_id_subscription_type_uniq',
						columnNames: ['streamer_id', 'subscription_type']
					})
				],
				columns: [
					new TableColumn({
						name: 'id',
						type: 'int',
						isPrimary: true,
						isNullable: false,
						isGenerated: true,
						generationStrategy: 'increment'
					}),
					new TableColumn({
						name: 'streamer_id',
						type: 'varchar',
						length: '10',
						isNullable: false
					}),
					new TableColumn({
						name: 'subscription_id',
						type: 'varchar',
						length: '36',
						isNullable: false
					}),
					new TableColumn({
						name: 'subscription_type',
						type: 'twitch_subscriptions_subscription_type_enum',
						isNullable: false
					})
				]
			}),
			true,
			true
		);

		await queryRunner.createTable(
			new Table({
				name: 'guild_subscription',
				foreignKeys: [
					new TableForeignKey({
						name: 'twitch_subscriptions_id_subscription_id_fkey',
						columnNames: ['subscription_id'],
						referencedColumnNames: ['id'],
						referencedTableName: 'twitch_subscriptions',
						onDelete: 'NO ACTION',
						onUpdate: 'NO ACTION'
					})
				],
				columns: [
					new TableColumn({
						name: 'guild_id',
						type: 'varchar',
						length: '19',
						isNullable: false,
						isPrimary: true
					}),
					new TableColumn({
						name: 'channel_id',
						type: 'varchar',
						length: '19',
						isNullable: false,
						isPrimary: true
					}),
					new TableColumn({
						name: 'message',
						type: 'varchar',
						length: '50',
						isNullable: true
					}),
					new TableColumn({
						name: 'subscription_id',
						type: 'integer',
						isNullable: false,
						isPrimary: true
					})
				]
			}),
			true,
			true
		);

		const oldTwitchSubscriptions = (await queryRunner.query(
			/* sql */ `SELECT * FROM public."twitch_stream_subscription";`
		)) as TwitchSubscriptionsOld[];

		const oldGuildData = (await queryRunner.query(/* sql */ `
			SELECT id, "notifications.streams.twitch.streamers" AS notificationData
			FROM public."guilds"
			WHERE jsonb_array_length("notifications.streams.twitch.streamers") > 0;
		`)) as GuildColumnsOld[];

		const transformedDataForTwitchSubscriptions = await this.mapOldTwitchDataToNewTwitchSubscriptions(oldTwitchSubscriptions);
		const transformedDataForGuildSubscriptions = this.mapOldGuildDataToNewGuildData(oldGuildData, transformedDataForTwitchSubscriptions);

		const stringifiedTwitchData = JSON.stringify([...transformedDataForTwitchSubscriptions.values()]).replace(/'/g, "''");
		const stringifiedGuildData = JSON.stringify(transformedDataForGuildSubscriptions).replace(/'/g, "''");

		await queryRunner.query(/* sql */ `
			INSERT INTO public."twitch_subscriptions"
			SELECT * FROM json_populate_recordset(NULL::public."twitch_subscriptions", '${stringifiedTwitchData}')
			ON CONFLICT DO NOTHING;
		`);

		await queryRunner.query(/* sql */ `
			INSERT INTO public."guild_subscription"
			SELECT * FROM json_populate_recordset(NULL::public."guild_subscription", '${stringifiedGuildData}')
			ON CONFLICT DO NOTHING;
		`);

		await queryRunner.dropColumn('guilds', 'notifications.streams.twitch.streamers');
		await queryRunner.dropTable('twitch_stream_subscription');
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropTable('guild_subscription');
		await queryRunner.dropTable('twitch_subscriptions');
		await queryRunner.query(/* sql */ `drop type twitch_subscriptions_subscription_type_enum;`);
	}

	private async mapOldTwitchDataToNewTwitchSubscriptions(oldData: TwitchSubscriptionsOld[]): Promise<Map<string, TwitchSubscriptionsNew>> {
		const allStreamerIds = [...new Set(oldData.map((entry) => entry.id))];
		const streamerIdSubscriptionIdMap = new Map<string, TwitchSubscriptionsNew>();

		let id = 1;

		for (const streamer of allStreamerIds) {
			const subscriptionId = await this.twitch.subscriptionsStreamHandle(streamer, TwitchEventSubTypes.StreamOnline);
			streamerIdSubscriptionIdMap.set(streamer, {
				id,
				streamer_id: streamer,
				subscription_id: subscriptionId,
				subscription_type: TwitchEventSubTypes.StreamOnline
			});

			id++;
		}

		return streamerIdSubscriptionIdMap;
	}

	private mapOldGuildDataToNewGuildData(
		oldData: GuildColumnsOld[],
		transformedDataForTwitchSubscriptions: Map<string, TwitchSubscriptionsNew>
	): GuildSubscriptions[] {
		const newSubscriptions: GuildSubscriptions[] = [];

		for (const guild of oldData) {
			for (const notificationEntry of guild.notificationdata) {
				const [streamerId, subscriptions] = notificationEntry;

				for (const subscription of subscriptions) {
					const newObject: GuildSubscriptions = {
						guild_id: guild.id,
						channel_id: subscription.channel,
						message: subscription.message || null,
						subscription_id: transformedDataForTwitchSubscriptions.get(streamerId)!.id
					};

					newSubscriptions.push(newObject);
				}
			}
		}

		return newSubscriptions;
	}
}

// #region Types

interface TwitchSubscriptionsNew {
	id: number;
	streamer_id: string;
	subscription_id: string;
	subscription_type: TwitchEventSubTypes;
}

interface TwitchSubscriptionsOld {
	id: string;
	is_streaming: boolean;
	expires_at: Date;
	guild_ids: string[];
}

interface GuildSubscriptions {
	guild_id: string;
	channel_id: string;
	message: string | null;
	subscription_id: number;
}

interface GuildColumnsOld {
	id: string;
	notificationdata: NotificationsStreamTwitch[];
}

const enum NotificationsStreamsTwitchEventStatus {
	Online,
	Offline
}

interface NotificationsStreamsTwitchStreamer {
	channel: string;
	author: string;
	message: string | null;
	status: NotificationsStreamsTwitchEventStatus;
	gamesBlacklist: readonly string[];
	gamesWhitelist: readonly string[];
	createdAt: number;
}

type NotificationsStreamTwitch = [streamerId: string, data: readonly NotificationsStreamsTwitchStreamer[]];

// #endregion
