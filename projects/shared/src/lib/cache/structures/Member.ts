import { isNullish, type Nullish } from '@sapphire/utilities';
import type { Nullable } from 'discord-api-types/utils/internals.js';
import type { APIGuildMember, APIUser } from 'discord-api-types/v10';
import { defaultOptional, fromTimestamp, toTimestamp } from '../../common/util.js';
import type { Reader } from '../../data/Reader.js';
import { Writer } from '../../data/Writer.js';
import type { IStructure } from './interfaces/IStructure.js';

export class Member implements IStructure {
	public readonly id: bigint;
	public readonly username: string;
	public readonly discriminator: number;
	public readonly bot: boolean | null;
	public readonly avatar: string | null;
	public readonly flags: number | null;
	public readonly nickname: string | null;
	public readonly guildAvatar: string | null;
	public readonly roles: readonly bigint[];
	public readonly joinedAt: number | null;
	public readonly premiumSince: number | null;
	public readonly deaf: boolean | null;
	public readonly mute: boolean | null;
	public readonly pending: boolean | null;
	public readonly communicationDisabledUntil: number | null;

	public constructor(data: Member.Data) {
		this.id = data.id;
		this.username = data.username;
		this.discriminator = data.discriminator;
		this.bot = data.bot ?? null;
		this.avatar = data.avatar ?? null;
		this.flags = data.flags ?? null;
		this.nickname = data.nickname ?? null;
		this.guildAvatar = data.guildAvatar ?? null;
		this.roles = data.roles;
		this.joinedAt = data.joinedAt ?? null;
		this.premiumSince = data.premiumSince ?? null;
		this.deaf = data.deaf ?? null;
		this.mute = data.mute ?? null;
		this.pending = data.pending ?? null;
		this.communicationDisabledUntil = data.communicationDisabledUntil ?? null;
	}

	public patch(data: Partial<Member.Json>) {
		return new Member({
			id: this.id,
			username: defaultOptional(data.user?.username, this.username),
			discriminator: defaultOptional(data.user?.discriminator, this.discriminator, Number),
			bot: defaultOptional(data.user?.bot, this.bot),
			avatar: defaultOptional(data.user?.avatar, this.avatar),
			flags: defaultOptional(data.user?.public_flags, this.flags),
			nickname: defaultOptional(data.nick, this.nickname),
			guildAvatar: defaultOptional(data.avatar, this.guildAvatar),
			roles: defaultOptional(data.roles, this.roles, (values) => values.map((role) => BigInt(role))),
			joinedAt: defaultOptional(data.joined_at, this.joinedAt, toTimestamp)!,
			premiumSince: defaultOptional(data.premium_since, this.premiumSince, toTimestamp),
			deaf: defaultOptional(data.deaf, this.deaf),
			mute: defaultOptional(data.mute, this.mute),
			pending: defaultOptional(data.pending, this.pending),
			communicationDisabledUntil: defaultOptional(data.communication_disabled_until, this.communicationDisabledUntil, toTimestamp)
		});
	}

	public toBuffer(): Buffer {
		return new Writer(100)
			.u64(this.id)
			.string(this.username)
			.u16(this.discriminator)
			.bool(this.bot)
			.string(this.avatar)
			.u32(this.flags)
			.string(this.nickname)
			.string(this.guildAvatar)
			.array(this.roles, (buffer, value) => buffer.u64(value))
			.date(this.joinedAt)
			.date(this.premiumSince)
			.bool(this.deaf)
			.bool(this.mute)
			.bool(this.pending)
			.date(this.communicationDisabledUntil).trimmed;
	}

	public toJSON(): Member.Json {
		return {
			user: {
				id: this.id.toString(),
				username: this.username,
				discriminator: this.discriminator.toString().padStart(4, '0'),
				bot: this.bot ?? undefined,
				avatar: this.avatar,
				public_flags: this.flags ?? undefined
			},
			nick: this.nickname,
			avatar: this.guildAvatar,
			roles: this.roles.map((role) => role.toString()),
			joined_at: fromTimestamp(this.joinedAt),
			premium_since: fromTimestamp(this.premiumSince),
			deaf: this.deaf ?? undefined,
			mute: this.mute ?? undefined,
			pending: this.pending ?? undefined,
			communication_disabled_until: fromTimestamp(this.communicationDisabledUntil)
		};
	}

	public static fromAPI(data: Member.Json, user?: APIUser): Member {
		user ??= data.user;
		if (isNullish(user)) throw new TypeError('Expected user to be defined');

		return new Member({
			id: BigInt(user.id),
			username: user.username,
			discriminator: Number(user.discriminator),
			bot: user.bot,
			avatar: user.avatar,
			flags: user.public_flags,
			nickname: data.nick,
			guildAvatar: data.avatar,
			roles: data.roles.map((role) => BigInt(role)),
			joinedAt: toTimestamp(data.joined_at),
			premiumSince: toTimestamp(data.premium_since),
			deaf: data.deaf,
			mute: data.mute,
			pending: data.pending,
			communicationDisabledUntil: toTimestamp(data.communication_disabled_until)
		});
	}

	public static fromBinary(reader: Reader): Member {
		return new Member({
			id: reader.u64()!,
			username: reader.string()!,
			discriminator: reader.u16()!,
			bot: reader.bool(),
			avatar: reader.string(),
			flags: reader.u32(),
			nickname: reader.string(),
			guildAvatar: reader.string(),
			roles: reader.array((reader) => reader.u64()!),
			joinedAt: reader.date()!,
			premiumSince: reader.date(),
			deaf: reader.bool()!,
			mute: reader.bool()!,
			pending: reader.bool(),
			communicationDisabledUntil: reader.date()
		});
	}
}

export namespace Member {
	export type Json = Omit<APIGuildMember, 'deaf' | 'mute' | 'joined_at'> &
		Partial<Pick<APIGuildMember, 'deaf' | 'mute'>> &
		Nullable<Pick<APIGuildMember, 'joined_at'>>;

	export interface Data {
		id: bigint;
		username: string;
		discriminator: number;
		bot?: boolean | Nullish;
		avatar?: string | Nullish;
		flags?: number | Nullish;
		nickname?: string | Nullish;
		guildAvatar?: string | Nullish;
		roles: readonly bigint[];
		joinedAt?: number | Nullish;
		premiumSince?: number | Nullish;
		deaf?: boolean | Nullish;
		mute?: boolean | Nullish;
		pending?: boolean | Nullish;
		communicationDisabledUntil?: number | Nullish;
	}
}
