import { BrandingColors } from '#utils/constants';
import type { Message } from 'discord.js';
import type { Connection, FindConditions, FindManyOptions, Repository } from 'typeorm';
import { connect } from '../database.config';
import { BannerEntity } from '../entities/BannerEntity';
import { GiveawayEntity } from '../entities/GiveawayEntity';
import { GuildEntity } from '../entities/GuildEntity';
import { ModerationEntity } from '../entities/ModerationEntity';
import { RpgBattleEntity } from '../entities/RpgBattleEntity';
import { RpgClassEntity } from '../entities/RpgClassEntity';
import { RpgGuildEntity } from '../entities/RpgGuildEntity';
import { RpgGuildRankEntity } from '../entities/RpgGuildRankEntity';
import { RpgItemEntity } from '../entities/RpgItemEntity';
import { RpgUserEntity } from '../entities/RpgUserEntity';
import { RpgUserItemEntity } from '../entities/RpgUserItemEntity';
import { ScheduleEntity } from '../entities/ScheduleEntity';
import { StarboardEntity } from '../entities/StarboardEntity';
import { SuggestionEntity } from '../entities/SuggestionEntity';
import { UserCooldownEntity } from '../entities/UserCooldownEntity';
import { UserGameIntegrationEntity } from '../entities/UserGameIntegrationEntity';
import { UserProfileEntity } from '../entities/UserProfileEntity';
import { ClientRepository } from '../repositories/ClientRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import { UserRepository } from '../repositories/UserRepository';
import { TwitchSubscriptionEntity } from '../entities/TwitchSubscriptionEntity';
import { GuildSubscriptionEntity } from '../entities/GuildSubscriptionEntity';

export class DbSet {
	public readonly connection: Connection;
	public readonly banners: Repository<BannerEntity>;
	public readonly clients: ClientRepository;
	public readonly giveaways: Repository<GiveawayEntity>;
	public readonly guilds: Repository<GuildEntity>;
	public readonly guildSubscriptions: Repository<GuildSubscriptionEntity>;
	public readonly members: MemberRepository;
	public readonly moderations: Repository<ModerationEntity>;
	public readonly rpgBattles: Repository<RpgBattleEntity>;
	public readonly rpgClasses: Repository<RpgClassEntity>;
	public readonly rpgGuildRanks: Repository<RpgGuildRankEntity>;
	public readonly rpgGuilds: Repository<RpgGuildEntity>;
	public readonly rpgItems: Repository<RpgItemEntity>;
	public readonly rpgUserItems: Repository<RpgUserItemEntity>;
	public readonly rpgUsers: Repository<RpgUserEntity>;
	public readonly schedules: Repository<ScheduleEntity>;
	public readonly starboards: Repository<StarboardEntity>;
	public readonly suggestions: Repository<SuggestionEntity>;
	public readonly twitchSubscriptions: Repository<TwitchSubscriptionEntity>;
	public readonly users: UserRepository;
	public readonly userProfiles: Repository<UserProfileEntity>;
	public readonly userGameIntegrations: Repository<UserGameIntegrationEntity>;
	public readonly userCooldowns: Repository<UserCooldownEntity>;

	private constructor(connection: Connection) {
		this.connection = connection;
		this.banners = this.connection.getRepository(BannerEntity);
		this.clients = this.connection.getCustomRepository(ClientRepository);
		this.giveaways = this.connection.getRepository(GiveawayEntity);
		this.guilds = this.connection.getRepository(GuildEntity);
		this.guildSubscriptions = this.connection.getRepository(GuildSubscriptionEntity);
		this.members = this.connection.getCustomRepository(MemberRepository);
		this.moderations = this.connection.getRepository(ModerationEntity);
		this.rpgBattles = this.connection.getRepository(RpgBattleEntity);
		this.rpgClasses = this.connection.getRepository(RpgClassEntity);
		this.rpgGuildRanks = this.connection.getRepository(RpgGuildRankEntity);
		this.rpgGuilds = this.connection.getRepository(RpgGuildEntity);
		this.rpgItems = this.connection.getRepository(RpgItemEntity);
		this.rpgUserItems = this.connection.getRepository(RpgUserItemEntity);
		this.rpgUsers = this.connection.getRepository(RpgUserEntity);
		this.schedules = this.connection.getRepository(ScheduleEntity);
		this.starboards = this.connection.getRepository(StarboardEntity);
		this.suggestions = this.connection.getRepository(SuggestionEntity);
		this.twitchSubscriptions = this.connection.getRepository(TwitchSubscriptionEntity);
		this.users = this.connection.getCustomRepository(UserRepository);
		this.userProfiles = this.connection.getRepository(UserProfileEntity);
		this.userGameIntegrations = this.connection.getRepository(UserGameIntegrationEntity);
		this.userCooldowns = this.connection.getRepository(UserCooldownEntity);
	}

	public async fetchModerationDirectMessageEnabled(id: string) {
		const entry = await this.users.findOne(id, { select: ['moderationDM'] });
		return entry?.moderationDM ?? true;
	}

	/**
	 * Finds entities that match given options.
	 */
	public fetchModerationEntry(options?: FindManyOptions<ModerationEntity>): Promise<ModerationEntity>;

	/**
	 * Finds entities that match given conditions.
	 */
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	public fetchModerationEntry(conditions?: FindConditions<ModerationEntity>): Promise<ModerationEntity>;
	public async fetchModerationEntry(optionsOrConditions?: FindConditions<ModerationEntity> | FindManyOptions<ModerationEntity>) {
		return this.moderations.findOne(optionsOrConditions as any);
	}

	/**
	 * Finds entities that match given options.
	 */
	public fetchModerationEntries(options?: FindManyOptions<ModerationEntity>): Promise<ModerationEntity[]>;

	/**
	 * Finds entities that match given conditions.
	 */
	// eslint-disable-next-line @typescript-eslint/unified-signatures
	public fetchModerationEntries(conditions?: FindConditions<ModerationEntity>): Promise<ModerationEntity[]>;
	public async fetchModerationEntries(optionsOrConditions?: FindConditions<ModerationEntity> | FindManyOptions<ModerationEntity>) {
		return this.moderations.find(optionsOrConditions as any);
	}

	public async fetchColor(message: Message) {
		const user = await this.userProfiles.findOne(message.author.id, { select: ['color'] });

		return user?.color || message.member?.displayColor || BrandingColors.Primary;
	}

	public static instance: DbSet | null = null;
	private static connectPromise: Promise<DbSet> | null;

	public static async connect() {
		return (DbSet.instance ??= await (DbSet.connectPromise ??= connect().then((connection) => {
			DbSet.connectPromise = null;
			return new DbSet(connection);
		})));
	}
}
