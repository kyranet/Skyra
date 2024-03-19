import { api } from '#lib/discord/Api';
import { ModerationAction } from '#lib/moderation/actions/base/ModerationAction';
import { resolveOnErrorCodes } from '#utils/common';
import { TypeVariation } from '#utils/moderationConstants';
import { isNullish } from '@sapphire/utilities';
import { RESTJSONErrorCodes, type Guild, type Snowflake } from 'discord.js';

export class ModerationActionTimeout extends ModerationAction<number | null, TypeVariation.Timeout> {
	public constructor() {
		super({
			type: TypeVariation.Timeout,
			isUndoActionAvailable: true,
			logPrefix: 'Moderation => Timeout'
		});
	}

	public override async isActive(guild: Guild, userId: Snowflake) {
		const member = await resolveOnErrorCodes(guild.members.fetch(userId), RESTJSONErrorCodes.UnknownMember);
		return !isNullish(member) && member.isCommunicationDisabled();
	}

	protected override async handleApplyPre(guild: Guild, entry: ModerationAction.Entry, data: ModerationAction.Data<number>) {
		const reason = await this.getReason(guild, entry.reason);
		const time = this.#getCommunicationDisabledUntil(data);
		await api().guilds.editMember(guild.id, entry.userId, { communication_disabled_until: time }, { reason });

		await this.cancelLastModerationEntryTaskFromUser({ guild, userId: entry.userId });
	}

	protected override async handleUndoPre(guild: Guild, entry: ModerationAction.Entry, data: ModerationAction.Data<number>) {
		const reason = await this.getReason(guild, entry.reason, true);
		const time = this.#getCommunicationDisabledUntil(data);
		await api().guilds.editMember(guild.id, entry.userId, { communication_disabled_until: time }, { reason });

		await this.cancelLastModerationEntryTaskFromUser({ guild, userId: entry.userId });
	}

	#getCommunicationDisabledUntil(data: ModerationAction.Data<number>) {
		return isNullish(data.context) ? null : new Date(data.context).toISOString();
	}
}
