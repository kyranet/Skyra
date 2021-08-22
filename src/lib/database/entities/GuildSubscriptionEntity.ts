import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TwitchSubscriptionEntity } from './TwitchSubscriptionEntity';

@Entity('guild_subscription', { schema: 'public' })
export class GuildSubscriptionEntity extends BaseEntity {
	@PrimaryColumn('varchar', { length: 19 })
	public guildId!: string;

	@ManyToOne(() => TwitchSubscriptionEntity, (twitchSubscription) => twitchSubscription.id, { primary: true, cascade: true, eager: true })
	@JoinColumn()
	public subscription!: TwitchSubscriptionEntity;

	@PrimaryColumn('varchar', { length: 19 })
	public channelId!: string;

	@Column('varchar', { nullable: true, length: 50 })
	public message?: string;
}
