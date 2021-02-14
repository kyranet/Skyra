/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { Events } from '#lib/types/Enums';
import { Store } from '@sapphire/framework';
import {
	AfterInsert,
	AfterLoad,
	AfterRemove,
	AfterUpdate,
	BaseEntity,
	Check,
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	OneToOne,
	PrimaryColumn
} from 'typeorm';
import { kBigIntTransformer } from '../utils/Transformers';
import { RpgUserEntity } from './RpgUserEntity';
import { UserCooldownEntity } from './UserCooldownEntity';
import { UserGameIntegrationEntity } from './UserGameIntegrationEntity';
import { UserProfileEntity } from './UserProfileEntity';

@Check(/* sql */ `money >= 0`)
@Check(/* sql */ `points >= 0`)
@Check(/* sql */ `reputations >= 0`)
@Entity('user', { schema: 'public' })
export class UserEntity extends BaseEntity {
	@PrimaryColumn('varchar', { length: 19 })
	public id!: string;

	@Column('integer', { default: 0 })
	public points = 0;

	@Column('integer', { default: 0 })
	public reputations = 0;

	@Column('boolean', { default: true })
	public moderationDM = true;

	@Column('bigint', { default: 0, transformer: kBigIntTransformer })
	public money = 0;

	@OneToOne(() => RpgUserEntity, (rpgUsers) => rpgUsers.user)
	public game?: RpgUserEntity;

	@OneToOne(() => UserProfileEntity, (profile) => profile.user, { cascade: true })
	public profile?: UserProfileEntity;

	@OneToMany(() => UserGameIntegrationEntity, (gi) => gi.user, { cascade: true })
	public gi?: UserGameIntegrationEntity<unknown>[];

	@OneToOne(() => UserCooldownEntity, (cooldown) => cooldown.user, { cascade: true })
	public cooldowns?: UserCooldownEntity;

	@ManyToMany(() => UserEntity, { cascade: true })
	@JoinTable()
	public spouses?: UserEntity[];

	#money: number | null;

	public constructor() {
		super();
		this.#money = null;
	}

	public get level() {
		return Math.floor(0.2 * Math.sqrt(this.points));
	}

	private get client() {
		return Store.injectedContext.client;
	}

	@AfterLoad()
	protected entityLoad() {
		this.#money = this.money;
	}

	@AfterInsert()
	@AfterUpdate()
	protected entityUpdate() {
		if (this.#money !== null && this.money !== this.#money) {
			this.client.emit(Events.MoneyTransaction, this, this.money - this.#money, this.#money);
			this.#money = this.money;
		}
	}

	@AfterRemove()
	protected entityRemove() {
		this.#money = null;
	}
}
