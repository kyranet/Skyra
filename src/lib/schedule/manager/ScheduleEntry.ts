import type { ModerationManagerEntry } from '#lib/moderation';
import { Events } from '#lib/types/Enums';
import type { TypeVariation } from '#utils/moderationConstants';
import type { Schedule } from '@prisma/client';
import { container } from '@sapphire/framework';
import { Cron } from '@sapphire/time-utilities';
import { isNullishOrEmpty } from '@sapphire/utilities';
import type { Snowflake } from 'discord-api-types/v10';

export class ScheduleEntry<Type extends ScheduleEntry.TaskId = ScheduleEntry.TaskId> {
	public id: number;
	public taskId: string;
	public time!: Date;
	public recurring!: Cron | null;
	public catchUp!: boolean;
	public data!: ScheduleEntry.TaskData[Type];

	/**
	 * Whether or not the entity is running
	 */
	#running = false;

	/**
	 * Whether or not the entity is paused
	 */
	#paused = false;

	public constructor(data: Schedule) {
		this.id = data.id;
		this.taskId = data.taskId;
		this.#patch(data);
	}

	public get task() {
		return container.stores.get('tasks').get(this.taskId) ?? null;
	}

	public get running(): boolean {
		return this.#running;
	}

	public resume() {
		this.#paused = false;
		return this;
	}

	public pause() {
		this.#paused = true;
		return this;
	}

	public reschedule(time: Date | number) {
		return container.schedule.reschedule(this, time);
	}

	public delete() {
		return container.schedule.remove(this);
	}

	public async run(): Promise<ResponseValue> {
		const { task } = this;
		if (!task?.enabled || this.#running || this.#paused) return { entry: this, type: ResponseType.Ignore };

		this.#running = true;
		let response: PartialResponseValue | null = null;
		try {
			response = (await task.run({ ...(this.data ?? {}), id: this.id })) as PartialResponseValue | null;
		} catch (error) {
			container.client.emit(Events.TaskError, error, { piece: task, entity: this });
		}

		this.#running = false;

		if (response !== null) return { ...response, entry: this };

		return this.recurring
			? { entry: this, type: ResponseType.Update, value: this.recurring.next() }
			: { entry: this, type: ResponseType.Finished };
	}

	public async update(data: ScheduleEntry.UpdateData<Type>) {
		const entry = await container.prisma.schedule.update({
			where: { id: this.id },
			data
		});

		this.#patch(entry);
	}

	public async reload() {
		const entry = await container.prisma.schedule.findUnique({ where: { id: this.id } });
		if (entry === null) throw new Error('Failed to reload the entity');

		this.#patch(entry);
	}

	#patch(data: Omit<Schedule, 'id' | 'taskId'>) {
		this.time = data.time;
		this.recurring = isNullishOrEmpty(data.recurring) ? null : new Cron(data.recurring);
		this.catchUp = data.catchUp;
		this.data = data.data as ScheduleEntry.TaskData[Type];
	}

	public static async create<const Type extends ScheduleEntry.TaskId>(data: ScheduleEntry.CreateData<Type>): Promise<ScheduleEntry<Type>> {
		const entry = await container.prisma.schedule.create({ data });
		return new ScheduleEntry(entry);
	}
}

export const enum ResponseType {
	Ignore,
	Delay,
	Update,
	Finished
}

export type PartialResponseValue =
	| { type: ResponseType.Ignore | ResponseType.Finished }
	| { type: ResponseType.Delay; value: number }
	| { type: ResponseType.Update; value: Date };

export type ResponseValue = PartialResponseValue & { entry: ScheduleEntry };

export namespace ScheduleEntry {
	export type TaskId = keyof TaskData;

	export interface TaskData {
		poststats: null;
		syncResourceAnalytics: null;
		moderationEndLockdown: LockdownData;
		moderationEndAddRole: SharedModerationTaskData<TypeVariation.RoleAdd>;
		moderationEndBan: SharedModerationTaskData<TypeVariation.Ban>;
		moderationEndMute: SharedModerationTaskData<TypeVariation.Mute>;
		moderationEndRemoveRole: SharedModerationTaskData<TypeVariation.RoleRemove>;
		moderationEndRestrictionAttachment: SharedModerationTaskData<TypeVariation.RestrictedAttachment>;
		moderationEndRestrictionEmbed: SharedModerationTaskData<TypeVariation.RestrictedEmbed>;
		moderationEndRestrictionEmoji: SharedModerationTaskData<TypeVariation.RestrictedEmoji>;
		moderationEndRestrictionReaction: SharedModerationTaskData<TypeVariation.RestrictedReaction>;
		moderationEndRestrictionVoice: SharedModerationTaskData<TypeVariation.RestrictedVoice>;
		moderationEndSetNickname: SharedModerationTaskData<TypeVariation.SetNickname>;
		moderationEndTimeout: SharedModerationTaskData<TypeVariation.Timeout>;
		moderationEndVoiceMute: SharedModerationTaskData<TypeVariation.VoiceMute>;
		moderationEndWarning: SharedModerationTaskData<TypeVariation.Warning>;
	}

	interface SharedModerationTaskData<Type extends TypeVariation> {
		caseID: number;
		userID: string;
		guildID: string;
		type: Type;
		duration: number | null;
		extraData: ModerationManagerEntry.ExtraData<Type>;
		scheduleRetryCount?: number;
	}

	export interface CreateData<Type extends TaskId> {
		taskId: Type;
		time: Date;
		recurring: string | null;
		catchUp: boolean;
		data: TaskData[Type];
	}

	export interface UpdateData<Type extends TaskId> {
		time?: Date;
		recurring?: string | null;
		catchUp?: boolean;
		data?: TaskData[Type];
	}
}

export type LockdownData = LockdownGuildData | LockdownChannelData | LockdownThreadData;

export enum LockdownType {
	Guild,
	Channel,
	Thread
}

export interface BaseLockdownData<T extends LockdownType> {
	/**
	 * The type of lockdown that was applied.
	 */
	type: T;

	/**
	 * The ID of the guild where the lockdown was applied.
	 */
	guildId: Snowflake;

	/**
	 * The ID of the user who initiated the lockdown.
	 */
	userId: Snowflake;
}

export interface LockdownGuildData extends BaseLockdownData<LockdownType.Guild> {
	/**
	 * The ID of the role that was locked down.
	 */
	roleId: Snowflake;

	/**
	 * The permissions that were applied to the role, as a bitfield.
	 */
	permissionsApplied: number;

	/**
	 * The original permissions for the role before the lockdown.
	 */
	permissionsOriginal: number;
}

export interface LockdownChannelData extends BaseLockdownData<LockdownType.Channel> {
	/**
	 * The ID of the channel where the lockdown was applied.
	 */
	channelId: Snowflake;

	/**
	 * The ID of the role that was locked down in the channel.
	 */
	roleId: Snowflake;

	/**
	 * The permissions that were applied to the role, as a bitfield.
	 */
	permissionsApplied: number | null;

	/**
	 * The original allow overrides for the role before the lockdown.
	 */
	permissionsOriginalAllow: number;

	/**
	 * The original deny overrides for the role before the lockdown.
	 */
	permissionsOriginalDeny: number;
}

export interface LockdownThreadData extends BaseLockdownData<LockdownType.Thread> {
	/**
	 * The ID of the thread where the lockdown was applied.
	 */
	channelId: Snowflake;
}
