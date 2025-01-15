import type { ModerationData } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { ScheduleEntry } from '#lib/schedule';
import { minutes } from '#utils/common';
import { TypeMetadata, type TypeVariation } from '#utils/moderationConstants';
import { UserError, container } from '@sapphire/framework';
import { isNullishOrZero } from '@sapphire/utilities';
import type { Guild, Snowflake, User } from 'discord.js';

/**
 * Represents a moderation manager entry.
 */
export class ModerationManagerEntry<Type extends TypeVariation = TypeVariation> {
	/**
	 * The ID of this moderation entry.
	 */
	public readonly id: number;

	/**
	 * The timestamp when the moderation entry was created.
	 */
	public readonly createdAt: number;

	/**
	 * The duration of the moderation entry since the creation.
	 *
	 * @remarks
	 *
	 * The value can be updated to add or remove the duration.
	 */
	public duration!: number | null;

	/**
	 * The extra data of the moderation entry.
	 */
	public readonly extraData: ExtraDataTypes[Type];

	/**
	 * The guild where the moderation entry was created.
	 */
	public readonly guild: Guild;

	/**
	 * The ID of the moderator who created the moderation entry.
	 */
	public readonly moderatorId: Snowflake;

	/**
	 * The ID of the user who is the target of the moderation entry.
	 */
	public readonly userId: Snowflake;

	/**
	 * The reason of the action in the moderation entry.
	 *
	 * @remarks
	 *
	 * The value can be updated to add or remove the reason.
	 */
	public reason: string | null;

	/**
	 * The image URL of the moderation entry.
	 *
	 * @remarks
	 *
	 * The value can be updated to add or remove the image URL.
	 */
	public imageURL: string | null;

	/**
	 * The type of the moderation entry.
	 */
	public readonly type: Type;

	/**
	 * The metadata of the moderation entry.
	 *
	 * @remarks
	 *
	 * The metadata is a bitfield that contains the following information:
	 * - `1 << 0`: The moderation entry is an undo action.
	 * - `1 << 1`: The moderation entry is temporary.
	 * - `1 << 3`: The moderation entry is archived.
	 *
	 * The value can be updated adding or removing any of the aforementioned
	 * flags.
	 */
	public metadata: TypeMetadata;

	#moderator: User | null;
	#user: User | null;
	#cacheExpiresTimeout = Date.now() + minutes(15);

	/**
	 * Constructs a new `ModerationManagerEntry` instance.
	 *
	 * @param data - The data to initialize the entry.
	 */
	public constructor(data: ModerationManagerEntry.Data<Type>) {
		this.id = data.id;
		this.createdAt = data.createdAt;
		this.extraData = data.extraData;
		this.guild = data.guild;
		this.reason = data.reason;
		this.imageURL = data.imageURL;
		this.type = data.type;
		this.metadata = data.metadata;

		this.#setDuration(data.duration);

		if (typeof data.moderator === 'string') {
			this.#moderator = null;
			this.moderatorId = data.moderator;
		} else {
			this.#moderator = data.moderator;
			this.moderatorId = data.moderator.id;
		}

		if (typeof data.user === 'string') {
			this.#user = null;
			this.userId = data.user;
		} else {
			this.#user = data.user;
			this.userId = data.user.id;
		}
	}

	/**
	 * Creates a new instance of `ModerationManagerEntry` with the same property values as the current instance.
	 */
	public clone() {
		return new ModerationManagerEntry(this.toData());
	}

	/**
	 * Updates the moderation entry with the given data.
	 *
	 * @remarks
	 *
	 * This method does not update the database, it only updates the instance
	 * with the given data, and updates the cache expiration time.
	 *
	 * @param data - The data to update the entry.
	 */
	public patch(data: ModerationManagerEntry.UpdateData) {
		if (data.duration !== undefined) this.#setDuration(data.duration);
		if (data.reason !== undefined) this.reason = data.reason;
		if (data.imageURL !== undefined) this.imageURL = data.imageURL;
		if (data.metadata !== undefined) this.metadata = data.metadata;

		this.#cacheExpiresTimeout = Date.now() + minutes(15);
	}

	/**
	 * The scheduled task for this moderation entry.
	 */
	public get task() {
		return container.client.schedules.queue.find((task) => this.#isMatchingTask(task)) ?? null;
	}

	/**
	 * The timestamp when the moderation entry expires, if any.
	 *
	 * @remarks
	 *
	 * If {@linkcode duration} is `null` or `0`, this property will be `null`.
	 */
	public get expiresTimestamp() {
		return isNullishOrZero(this.duration) ? null : this.createdAt + this.duration;
	}

	/**
	 * Whether the moderation entry is expired.
	 *
	 * @remarks
	 *
	 * If {@linkcode expiresTimestamp} is `null`, this property will always be
	 * `false`.
	 */
	public get expired() {
		const { expiresTimestamp } = this;
		return expiresTimestamp !== null && expiresTimestamp < Date.now();
	}

	/**
	 * Whether the moderation entry is cache expired, after 15 minutes.
	 *
	 * @remarks
	 *
	 * This property is used to determine if the entry should be removed from
	 * the cache, and will be updated to extend the cache life when
	 * {@linkcode patch} is called.
	 */
	public get cacheExpired() {
		return this.#cacheExpiresTimeout < Date.now();
	}

	/**
	 * Checks if the entry is an undo action.
	 */
	public isUndo() {
		return (this.metadata & TypeMetadata.Undo) === TypeMetadata.Undo;
	}

	/**
	 * Checks if the entry is temporary.
	 */
	public isTemporary() {
		return (this.metadata & TypeMetadata.Temporary) === TypeMetadata.Temporary;
	}

	/**
	 * Checks if the entry is archived.
	 */
	public isArchived() {
		return (this.metadata & TypeMetadata.Archived) === TypeMetadata.Archived;
	}

	/**
	 * Checks if the entry is completed.
	 */
	public isCompleted() {
		return (this.metadata & TypeMetadata.Completed) === TypeMetadata.Completed;
	}

	/**
	 * Fetches the moderator who created the moderation entry.
	 */
	public async fetchModerator() {
		return (this.#moderator ??= await container.client.users.fetch(this.moderatorId));
	}

	/**
	 * Fetches the target user of the moderation entry.
	 */
	public async fetchUser() {
		return (this.#user ??= await container.client.users.fetch(this.userId));
	}

	/**
	 * Returns a clone of the data for this moderation manager entry.
	 */
	public toData(): ModerationManagerEntry.Data<Type> {
		return {
			id: this.id,
			createdAt: this.createdAt,
			duration: this.duration,
			extraData: this.extraData,
			guild: this.guild,
			moderator: this.moderatorId,
			user: this.userId,
			reason: this.reason,
			imageURL: this.imageURL,
			type: this.type,
			metadata: this.metadata
		};
	}

	public toJSON() {
		return {
			id: this.id,
			createdAt: this.createdAt,
			duration: this.duration,
			extraData: this.extraData,
			guildId: this.guild.id,
			moderatorId: this.moderatorId,
			userId: this.userId,
			reason: this.reason,
			imageURL: this.imageURL,
			type: this.type,
			metadata: this.metadata
		};
	}

	#isMatchingTask(task: ScheduleEntry) {
		return (
			task.data !== null && //
			'caseID' in task.data &&
			task.data.caseID === this.id &&
			task.data.guildID === this.guild.id
		);
	}

	#setDuration(duration: bigint | number | null) {
		if (typeof duration === 'bigint') duration = Number(duration);
		if (isNullishOrZero(duration)) {
			this.duration = null;
			this.metadata &= ~TypeMetadata.Temporary;
		} else {
			this.duration = duration;
			this.metadata |= TypeMetadata.Temporary;
		}
	}

	public static from(guild: Guild, entity: ModerationData) {
		if (guild.id !== entity.guildId) {
			throw new UserError({ identifier: LanguageKeys.Arguments.CaseNotInThisGuild, context: { parameter: entity.caseId } });
		}

		return new this({
			id: entity.caseId,
			createdAt: entity.createdAt ? entity.createdAt.getTime() : Date.now(),
			duration: entity.duration,
			extraData: entity.extraData as any,
			guild,
			moderator: entity.moderatorId,
			user: entity.userId!,
			reason: entity.reason,
			imageURL: entity.imageURL,
			type: entity.type,
			metadata: entity.metadata
		});
	}
}

export namespace ModerationManagerEntry {
	export interface Data<Type extends TypeVariation = TypeVariation> {
		id: number;
		createdAt: number;
		duration: bigint | number | null;
		extraData: ExtraData<Type>;
		guild: Guild;
		moderator: User | Snowflake;
		user: User | Snowflake;
		reason: string | null;
		imageURL: string | null;
		type: Type;
		metadata: TypeMetadata;
	}

	export type CreateData<Type extends TypeVariation = TypeVariation> = MakeOptional<
		Omit<Data<Type>, 'id' | 'guild' | 'createdAt'>,
		'duration' | 'imageURL' | 'extraData' | 'metadata' | 'moderator' | 'reason'
	>;
	export type UpdateData<Type extends TypeVariation = TypeVariation> = Partial<
		Omit<Data<Type>, 'id' | 'createdAt' | 'extraData' | 'moderator' | 'user' | 'type' | 'guild'>
	>;

	export type ExtraData<Type extends TypeVariation = TypeVariation> = ExtraDataTypes[Type];
}

type MakeOptional<Type, OptionalKeys extends keyof Type> = Omit<Type, OptionalKeys> & Partial<Pick<Type, OptionalKeys>>;

interface ExtraDataTypes {
	[TypeVariation.Ban]: null;
	[TypeVariation.Kick]: null;
	[TypeVariation.Mute]: Snowflake[];
	[TypeVariation.Softban]: null;
	[TypeVariation.VoiceKick]: null;
	[TypeVariation.VoiceMute]: null;
	[TypeVariation.Warning]: null;
	[TypeVariation.RestrictedReaction]: null;
	[TypeVariation.RestrictedEmbed]: null;
	[TypeVariation.RestrictedAttachment]: null;
	[TypeVariation.RestrictedVoice]: null;
	[TypeVariation.SetNickname]: { oldName: string | null };
	[TypeVariation.RoleAdd]: { role: Snowflake };
	[TypeVariation.RoleRemove]: { role: Snowflake };
	[TypeVariation.RestrictedEmoji]: null;
	[TypeVariation.Timeout]: null;
}
