/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { GuildSettings } from '#lib/database/keys';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { ModerationManager, ModerationManagerUpdateData } from '#lib/moderation';
import { Events } from '#lib/types/Enums';
import {
	metadata,
	ModerationManagerDescriptionData,
	ModerationTypeAssets,
	TypeBits,
	TypeCodes,
	TypeMetadata,
	TypeVariation,
	TypeVariationAppealNames
} from '#utils/moderationConstants';
import { UserError } from '@sapphire/framework';
import { Duration, Time } from '@sapphire/time-utilities';
import { isNullishOrZero, isNumber, NonNullObject, parseURL } from '@sapphire/utilities';
import { Client, MessageEmbed, User } from 'discord.js';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { readSettings } from '../settings';
import { kBigIntTransformer } from '../utils/Transformers';

@Entity('moderation', { schema: 'public' })
export class ModerationEntity extends BaseEntity {
	#client: Client = null!;
	#manager: ModerationManager = null!;
	#moderator: User | null = null;
	#user: User | null = null;
	#timeout = Date.now() + Time.Minute * 15;

	@PrimaryColumn('integer')
	public caseId = -1;

	@Column('timestamp without time zone', { nullable: true, default: () => 'null' })
	public createdAt: Date | null = null;

	@Column('bigint', { nullable: true, default: () => 'null', transformer: kBigIntTransformer })
	public duration: number | null = null;

	@Column('json', { nullable: true, default: () => 'null' })
	public extraData: unknown[] | NonNullObject | null = null;

	@PrimaryColumn('varchar', { length: 19 })
	public guildId: string = null!;

	@Column('varchar', { length: 19, default: process.env.CLIENT_ID })
	public moderatorId: string = process.env.CLIENT_ID;

	@Column('varchar', { nullable: true, length: 2000, default: () => 'null' })
	public reason: string | null = null;

	@Column('varchar', { nullable: true, length: 2000, default: () => 'null' })
	public imageURL: string | null = null;

	@Column('varchar', { nullable: true, length: 19, default: () => 'null' })
	public userId: string | null = null;

	@Column('smallint')
	public type?: number | null;

	public constructor(data?: Partial<ModerationEntity>) {
		super();

		if (data) {
			Object.assign(this, data);
			this.type = ModerationEntity.getTypeFlagsFromDuration(this.type!, this.duration);
		}
	}

	public setup(manager: ModerationManager) {
		this.#manager = manager;
		this.guildId = manager.guild.id;
		return this;
	}

	public clone() {
		return new ModerationEntity(this).setup(this.#manager);
	}

	public equals(other: ModerationEntity) {
		return (
			this.type === other.type &&
			this.duration === other.duration &&
			this.extraData === other.extraData &&
			this.reason === other.reason &&
			this.imageURL === other.imageURL &&
			this.userId === other.userId &&
			this.moderatorId === other.moderatorId
		);
	}

	public get guild() {
		return this.#manager.guild;
	}

	public fetchChannel() {
		return this.#manager.fetchChannel();
	}

	/**
	 * Retrieve the metadata (title and color) for this entry.
	 */
	public get metadata(): ModerationTypeAssets {
		const data = metadata.get(this.type! & ~TypeMetadata.Invalidated);
		if (typeof data === 'undefined') throw new Error(`Inexistent metadata for '0b${this.type!.toString(2).padStart(8, '0')}'.`);
		return data;
	}

	/**
	 * Retrieve the title for this entry's embed.
	 */
	public get title(): string {
		return this.metadata.title;
	}

	/**
	 * Retrieve the color for this entry's embed.
	 */
	public get color(): number {
		return this.metadata.color;
	}

	/**
	 * Retrieve the creation date for this entry's embed. Returns current date if not set.
	 */
	public get createdTimestamp(): number {
		return this.createdAt?.getTime() ?? Date.now();
	}

	/**
	 * Get the variation type for this entry.
	 */
	public get typeVariation() {
		/**
		 * Variation is assigned to the first 4 bits of the entire type, therefore:
		 * 0b00001111 &
		 * 0bXXXX0100 =
		 * 0b00000100
		 */
		return (this.type! & TypeBits.Variation) as TypeVariation;
	}

	/**
	 * Get the metadata type for this entry.
	 */
	public get typeMetadata() {
		/**
		 * Metadata is assigned to the last 4 bits of the entire type, therefore:
		 * 0b11110000 &
		 * 0b0010XXXX =
		 * 0b00100000
		 */
		return (this.type! & TypeBits.Metadata) as TypeMetadata;
	}

	public get appealType() {
		return (this.type! & TypeMetadata.Appeal) === TypeMetadata.Appeal;
	}

	public get temporaryType() {
		return (this.type! & TypeMetadata.Temporary) === TypeMetadata.Temporary;
	}

	public get temporaryFastType() {
		return (this.type! & TypeMetadata.Fast) === TypeMetadata.Fast;
	}

	public get invalidated() {
		return (this.type! & TypeMetadata.Invalidated) === TypeMetadata.Invalidated;
	}

	public get appealable() {
		return !this.appealType && metadata.has(this.typeVariation | TypeMetadata.Appeal);
	}

	public get temporable() {
		return metadata.has(this.type! | TypeMetadata.Temporary);
	}

	public get cacheExpired() {
		return Date.now() > this.#timeout;
	}

	public get cacheRemaining() {
		return Math.max(Date.now() - this.#timeout, 0);
	}

	public get appealTaskName() {
		if (!this.appealable) return null;
		switch (this.typeVariation) {
			case TypeVariation.Warning:
				return TypeVariationAppealNames.Warning;
			case TypeVariation.Mute:
				return TypeVariationAppealNames.Mute;
			case TypeVariation.Ban:
				return TypeVariationAppealNames.Ban;
			case TypeVariation.VoiceMute:
				return TypeVariationAppealNames.VoiceMute;
			case TypeVariation.RestrictedAttachment:
				return TypeVariationAppealNames.RestrictedAttachment;
			case TypeVariation.RestrictedReaction:
				return TypeVariationAppealNames.RestrictedReaction;
			case TypeVariation.RestrictedEmbed:
				return TypeVariationAppealNames.RestrictedEmbed;
			case TypeVariation.RestrictedEmoji:
				return TypeVariationAppealNames.RestrictedEmoji;
			case TypeVariation.RestrictedVoice:
				return TypeVariationAppealNames.RestrictedVoice;
			case TypeVariation.SetNickname:
				return TypeVariationAppealNames.SetNickname;
			case TypeVariation.AddRole:
				return TypeVariationAppealNames.AddRole;
			case TypeVariation.RemoveRole:
				return TypeVariationAppealNames.RemoveRole;
			default:
				return null;
		}
	}

	public get shouldSend() {
		// If the moderation log is not anonymous, it should always send
		if (this.moderatorId !== process.env.CLIENT_ID) return true;

		const before = Date.now() - Time.Minute;
		const type = this.typeVariation;
		const checkSoftBan = type === TypeVariation.Ban;
		for (const entry of this.#manager.values()) {
			// If it's not the same user target or if it's at least 1 minute old, skip
			if (this.userId !== entry.userId || before > entry.createdTimestamp) continue;

			// If there was a log with the same type in the last minute, do not duplicate
			if (type === entry.typeVariation) return false;

			// If this log is a ban or an unban, but the user was softbanned recently, abort
			if (checkSoftBan && entry.type === TypeCodes.SoftBan) return false;
		}

		// For all other cases, it should send
		return true;
	}

	public get task() {
		const { guild } = this.#manager;
		return (
			this.#client.schedules.queue.find((value) => value.data && value.data.caseID === this.caseId && value.data.guildID === guild.id) ?? null
		);
	}

	public async fetchUser() {
		if (!this.userId) {
			throw new Error('userId must be set before calling this method.');
		}

		const previous = this.#user;
		if (previous?.id === this.userId) return previous;

		const user = await this.#client.users.fetch(this.userId);
		this.#user = user;
		return user;
	}

	public async fetchModerator() {
		const previous = this.#moderator;
		if (previous) return previous;

		const moderator = await this.#client.users.fetch(this.moderatorId);
		this.#moderator = moderator;
		return moderator;
	}

	public isType(type: TypeCodes) {
		return (
			this.type === type || this.type === (type | TypeMetadata.Temporary) || this.type === (type | TypeMetadata.Temporary | TypeMetadata.Fast)
		);
	}

	public async edit(data: ModerationManagerUpdateData = {}) {
		const dataWithType = { ...data, type: ModerationEntity.getTypeFlagsFromDuration(this.type!, data.duration ?? this.duration) };
		const clone = this.clone();
		try {
			Object.assign(this, dataWithType);
			await this.save();
		} catch (error) {
			Object.assign(this, clone);
			throw error;
		}

		this.#client.emit(Events.ModerationEntryEdit, clone, this);
		return this;
	}

	public async invalidate() {
		if (this.invalidated) return this;
		const clone = this.clone();
		try {
			this.type! |= TypeMetadata.Invalidated;
			await this.save();
		} catch (error) {
			this.type = clone.type;
			throw error;
		}

		this.#client.emit(Events.ModerationEntryEdit, clone, this);
		return this;
	}

	public async prepareEmbed() {
		if (!this.userId) throw new Error('A user has not been set.');
		const manager = this.#manager;

		const [user, moderator] = await Promise.all([this.fetchUser(), this.fetchModerator()]);

		const [prefix, t] = await readSettings(manager.guild, (settings) => [settings[GuildSettings.Prefix], settings.getLanguage()]);
		const formattedDuration = this.duration ? t(LanguageKeys.Commands.Moderation.ModerationLogExpiresIn, { duration: this.duration }) : '';
		const descriptionData: ModerationManagerDescriptionData = {
			type: this.title,
			userName: user.username,
			userDiscriminator: user.discriminator,
			userId: this.userId,
			reason: this.reason,
			prefix,
			caseId: this.caseId,
			formattedDuration
		};

		const body = t(LanguageKeys.Commands.Moderation.ModerationLogDescriptionTypeAndUser, { data: descriptionData });
		const reason = t(
			this.reason
				? LanguageKeys.Commands.Moderation.ModerationLogDescriptionWithReason
				: LanguageKeys.Commands.Moderation.ModerationLogDescriptionWithoutReason,
			{
				data: descriptionData
			}
		);

		const embed = new MessageEmbed()
			.setColor(this.color)
			.setAuthor(moderator.tag, moderator.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setDescription(`${body}\n${reason}`)
			.setFooter(
				t(LanguageKeys.Commands.Moderation.ModerationLogFooter, { caseId: this.caseId }),
				this.#client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true })
			)
			.setTimestamp(this.createdTimestamp);

		if (this.imageURL) embed.setImage(this.imageURL);
		return embed;
	}

	public setCase(value: number) {
		this.caseId = value;
		return this;
	}

	public setDuration(duration: string | number | null) {
		if (this.temporable) {
			if (typeof duration === 'string') duration = new Duration(duration.trim()).offset;
			if (typeof duration === 'number' && (duration <= 0 || duration > Time.Year)) duration = null;

			if (isNumber(duration)) {
				if (duration < 0 || duration > Time.Year * 5) {
					throw new UserError({
						identifier: LanguageKeys.Commands.Moderation.AutomaticParameterShowDurationPermanent,
						context: { duration }
					});
				}
				this.duration = isNullishOrZero(duration) ? null : duration;
			} else {
				this.duration = null;
			}
		} else {
			this.duration = null;
		}

		this.type = ModerationEntity.getTypeFlagsFromDuration(this.type!, this.duration);
		return this;
	}

	public setExtraData(value: Record<string, unknown> | null) {
		this.extraData = value;
		return this;
	}

	public setModerator(value: User | string) {
		if (value instanceof User) {
			this.#moderator = value;
			this.moderatorId = value.id;
		} else if (this.moderatorId !== value) {
			this.#moderator = null;
			this.moderatorId = value;
		}
		return this;
	}

	public setReason(value?: string | null) {
		if (typeof value === 'string') {
			const trimmed = value.trim();
			value = trimmed.length === 0 ? null : trimmed;
		} else {
			value = null;
		}

		this.reason = value;
		return this;
	}

	public setImageURL(value?: string | null) {
		this.imageURL = (value && parseURL(value)?.href) ?? null;
		return this;
	}

	public setType(value: TypeCodes) {
		this.type = value;
		return this;
	}

	public setUser(value: User | string) {
		if (value instanceof User) {
			this.#user = value;
			this.userId = value.id;
		} else {
			this.userId = value;
		}

		return this;
	}

	public async create() {
		// If the entry was created, there is no point on re-sending
		if (!this.userId || this.createdAt) return null;
		this.createdAt = new Date();

		// If the entry should not send, abort creation
		if (!this.shouldSend) return null;

		this.caseId = (await this.#manager.getCurrentId()) + 1;
		await this.save();
		this.#manager.insert(this);

		this.#client.emit(Events.ModerationEntryAdd, this);
		return this;
	}

	private static getTypeFlagsFromDuration(type: TypeCodes, duration: number | null) {
		if (duration === null) return type & ~(TypeMetadata.Temporary | TypeMetadata.Fast);
		if (duration < Time.Minute) return type | TypeMetadata.Temporary | TypeMetadata.Fast;
		return type | TypeMetadata.Temporary;
	}
}
