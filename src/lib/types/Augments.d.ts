/* eslint-disable @typescript-eslint/unified-signatures */
import type { NP, Queue, QueueClient, QueueClientOptions, QueueEntry } from '#lib/audio';
import type { DbSet, GuildEntity, SettingsManager } from '#lib/database';
import type { GuildMemberFetchQueue } from '#lib/discord/GuildMemberFetchQueue';
import type { ModelStore } from '#lib/grpc';
import type { WorkerManager } from '#lib/moderation/workers/WorkerManager';
import type { AnalyticsData, ColorHandler, GiveawayManager, InviteCodeValidEntry, InviteStore, ScheduleManager, SkyraCommand } from '#lib/structures';
import type { TwitchStreamStatus } from '#lib/types/AnalyticsSchema';
import type { WebsocketHandler } from '#root/audio/lib/websocket/WebsocketHandler';
import type { O } from '#utils/constants';
import type { Leaderboard } from '#utils/Leaderboard';
import type { LLRCData, LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import type { Twitch } from '#utils/Notifications/Twitch';
import type { Piece, Store } from '@sapphire/framework';
import type { ApiResponse } from '@sapphire/plugin-api';
import type { Nullish, PickByValue } from '@sapphire/utilities';
import type { Image } from 'canvas-constructor/skia';
import type { Guild, GuildChannel, Message, MessageEmbed, NewsChannel, Role, Snowflake, TextChannel, User, VoiceChannel } from 'discord.js';
import type { Redis } from 'ioredis';
import type { TaskErrorPayload, TwitchEventSubEvent, TwitchEventSubOnlineEvent } from './definitions';
import type { Scope } from './definitions/ArgumentTypes';
import type { MessageAcknowledgeable } from './Discord';
import type { Events } from './Enums';
import type { CustomFunctionGet, CustomGet } from './Utils';

declare module 'discord.js' {
	interface Client {
		readonly dev: boolean;
		readonly analytics: AnalyticsData | null;
		readonly audio: QueueClient | null;
		readonly giveaways: GiveawayManager;
		readonly guildMemberFetchQueue: GuildMemberFetchQueue;
		readonly invites: InviteStore;
		readonly leaderboard: Leaderboard;
		readonly llrCollectors: Set<LongLivingReactionCollector>;
		readonly schedules: ScheduleManager;
		readonly twitch: Twitch;
		readonly version: string;
		readonly webhookError: Webhook | null;
		readonly websocket: WebsocketHandler;
	}

	interface ClientEvents {
		[Events.TaskError]: [error: Error, payload: TaskErrorPayload];
	}

	interface ClientOptions {
		audio?: QueueClientOptions;
		nms?: {
			role?: number;
			everyone?: number;
		};
		schedule?: {
			interval: number;
		};
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		afk: Redis;
		db: DbSet;
		grpc: ModelStore;
		schedule: ScheduleManager;
		settings: SettingsManager;
		workers: WorkerManager;
	}
}

declare module '@sapphire/framework' {
	interface ArgType {
		case: number;
		channelName: GuildChannel;
		cleanString: string;
		color: ColorHandler;
		command: SkyraCommand;
		commandMatch: string;
		commandName: SkyraCommand;
		duration: Date;
		emoji: string;
		image: Image;
		invite: InviteCodeValidEntry;
		language: string;
		overwatchPlayer: string;
		piece: Piece;
		range: number[];
		reset: true;
		roleName: Role;
		scope: Scope;
		shinyWager: number;
		snowflake: Snowflake;
		song: string[];
		store: Store<Piece>;
		textChannelName: TextChannel;
		textOrNewsChannelName: TextChannel | NewsChannel;
		time: Date;
		timespan: number;
		userName: User;
	}

	interface Preconditions {
		AudioEnabled: never;
		Administrator: never;
		BotOwner: never;
		DJ: never;
		Everyone: never;
		Moderator: never;
		ServerOwner: never;
		Spam: never;
	}

	interface SapphireClient {
		emit(event: Events.Error, error: Error): boolean;
		emit(event: Events.AnalyticsSync, guilds: number, users: number): boolean;
		emit(event: Events.CommandUsageAnalytics, command: string, category: string, subCategory: string): boolean;
		emit(
			event: Events.GuildAnnouncementSend | Events.GuildAnnouncementEdit,
			message: Message,
			resultMessage: Message,
			channel: TextChannel,
			role: Role,
			content: string
		): boolean;
		emit(event: Events.GuildAnnouncementError, message: Message, channel: TextChannel, role: Role, content: string, error: any): boolean;
		emit(
			event: Events.GuildMessageLog,
			guild: Guild,
			channelId: string | Nullish,
			key: PickByValue<GuildEntity, string | Nullish>,
			makeMessage: () => Promise<MessageEmbed> | MessageEmbed
		): boolean;
		emit(event: Events.ReactionBlocked, data: LLRCData, emoji: string): boolean;
		emit(event: Events.MoneyTransaction, target: User, moneyChange: number, moneyBeforeChange: number): boolean;
		emit(event: Events.MoneyPayment, message: Message, user: User, target: User, money: number): boolean;
		emit(event: Events.MusicAddNotify, acknowledgeable: MessageAcknowledgeable, tracks: readonly QueueEntry[]): boolean;
		emit(event: Events.MusicFinish, queue: Queue): boolean;
		emit(event: Events.MusicFinishNotify, acknowledgeable: MessageAcknowledgeable): boolean;
		emit(event: Events.MusicLeave, queue: Queue): boolean;
		emit(event: Events.MusicPrune, queue: Queue): boolean;
		emit(event: Events.MusicQueueSync, queue: Queue): boolean;
		emit(event: Events.MusicRemove, queue: Queue): boolean;
		emit(event: Events.MusicRemoveNotify, acknowledgeable: MessageAcknowledgeable, entry: QueueEntry): boolean;
		emit(event: Events.MusicReplayUpdate, queue: Queue, repeating: boolean): boolean;
		emit(event: Events.MusicReplayUpdateNotify, acknowledgeable: MessageAcknowledgeable, repeating: boolean): boolean;
		emit(event: Events.MusicSongPause, queue: Queue): boolean;
		emit(event: Events.MusicSongPauseNotify, acknowledgeable: MessageAcknowledgeable): boolean;
		emit(event: Events.MusicSongPlay, queue: Queue, status: NP): boolean;
		emit(event: Events.MusicSongPlayNotify, acknowledgeable: MessageAcknowledgeable, entry: QueueEntry): boolean;
		emit(event: Events.MusicSongReplay, queue: Queue, status: NP): boolean;
		emit(event: Events.MusicSongResume, queue: Queue): boolean;
		emit(event: Events.MusicSongResumeNotify, acknowledgeable: MessageAcknowledgeable): boolean;
		emit(event: Events.MusicSongSeekUpdate, queue: Queue): boolean;
		emit(event: Events.MusicSongSeekUpdateNotify, acknowledgeable: MessageAcknowledgeable, time: number): boolean;
		emit(event: Events.MusicSongSkip, queue: Queue): boolean;
		emit(event: Events.MusicSongSkipNotify, acknowledgeable: MessageAcknowledgeable, entry: QueueEntry): boolean;
		emit(event: Events.MusicSongVolumeUpdate, queue: Queue, next: number): boolean;
		emit(event: Events.MusicSongVolumeUpdateNotify, acknowledgeable: MessageAcknowledgeable, previous: number, next: number): boolean;
		emit(event: Events.MusicVoiceChannelJoin, queue: Queue, voiceChannel: VoiceChannel): boolean;
		emit(event: Events.MusicVoiceChannelLeave, queue: Queue): boolean;
		emit(event: Events.MusicConnect, queue: Queue, voiceChannelID: string): boolean;
		emit(event: Events.ResourceAnalyticsSync): boolean;
		emit(event: Events.TwitchStreamHookedAnalytics, status: TwitchStreamStatus): boolean;
		emit(events: Events.TwitchStreamOnline, event: TwitchEventSubOnlineEvent): boolean;
		emit(events: Events.TwitchStreamOffline, event: TwitchEventSubEvent): boolean;
		emit(event: Events.TaskError, error: Error, payload: TaskErrorPayload): boolean;
		emit(event: string | symbol, ...args: any[]): boolean;
	}
}

declare module 'i18next' {
	export interface TFunction {
		lng: string;
		ns?: string;

		<K extends string, TReturn>(key: CustomGet<K, TReturn>, options?: TOptionsBase | string): TReturn;
		<K extends string, TReturn>(key: CustomGet<K, TReturn>, defaultValue: TReturn, options?: TOptionsBase | string): TReturn;
		<K extends string, TArgs extends O, TReturn>(key: CustomFunctionGet<K, TArgs, TReturn>, options?: TOptions<TArgs>): TReturn;
		<K extends string, TArgs extends O, TReturn>(
			key: CustomFunctionGet<K, TArgs, TReturn>,
			defaultValue: TReturn,
			options?: TOptions<TArgs>
		): TReturn;
	}
}
