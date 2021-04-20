import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { kBigIntTransformer } from '../utils/Transformers';

@Entity('member', { schema: 'public' })
export class MemberEntity extends BaseEntity {
	@PrimaryColumn('varchar', { length: 19 })
	public guildID!: string;

	@PrimaryColumn('varchar', { length: 19 })
	public userID!: string;

	@Column('bigint', { default: 0, transformer: kBigIntTransformer })
	public points = 0;

	public get level() {
		return Math.floor(0.2 * Math.sqrt(this.points));
	}
}
