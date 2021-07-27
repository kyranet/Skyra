import { ModerationEntity } from '#lib/database';
import type { ModerationManagerCreateData } from '#lib/moderation';
import type { Schedules } from '#lib/types/Enums';
import type { User } from 'discord.js';
import { AttachPreHandledContext, BaseAction } from './BaseAction';

export abstract class BaseReversibleAction<
	Options extends BaseReversibleAction.RunOptions = BaseReversibleAction.RunOptions,
	Context = unknown
> extends BaseAction<Options, Context> {
	protected readonly task: Schedules;

	public constructor(options: BaseReversibleAction.Options) {
		super(options);
		this.task = options.task;
	}

	protected async postHandleTarget(user: User, options: AttachPreHandledContext<Options, Context>): Promise<void> {
		await this.postHandleTargetTask(user, options);
		await super.postHandleTarget(user, options);
	}

	protected async postHandleTargetTask(user: User, options: AttachPreHandledContext<Options, Context>): Promise<void> {
		// Retrieve all moderation logs regarding a user.
		const logs = await options.guild.moderation.fetch(user.id);

		// Filter all logs by valid and by type of mute (isType will include temporary and invisible).
		const extra = this.postHandleTargetTaskExtraCallback(user, options);
		const log = logs.filter((entry) => !entry.invalidated && entry.createdAt !== null && entry.isType(this.type) && extra(entry)).last();
		if (log === undefined) return;

		// Cancel the previous moderation log's task:
		const { task } = log;
		if (task && !task.running) await task.delete();
	}

	protected postHandleTargetTaskExtraCallback(user: User, options: AttachPreHandledContext<Options, Context>): BaseReversibleAction.ExtraCallback;
	protected postHandleTargetTaskExtraCallback(): BaseReversibleAction.ExtraCallback {
		return () => true;
	}

	protected transformModerationEntryOptions(user: User, options: Options): ModerationManagerCreateData {
		return { ...super.transformModerationEntryOptions(user, options), duration: options.duration };
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BaseReversibleAction {
	export interface Options extends BaseAction.Options {
		task: Schedules;
	}

	export interface RunOptions extends BaseAction.RunOptions {
		duration: number | null;
	}

	export interface ExtraCallback {
		(entry: ModerationEntity): boolean;
	}
}
