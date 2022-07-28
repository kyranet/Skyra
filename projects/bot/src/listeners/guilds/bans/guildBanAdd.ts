import { GuildSettings, readSettings } from '#lib/database';
import { getModeration } from '#utils/functions';
import { TypeCodes } from '#utils/moderationConstants';
import { Listener } from '@sapphire/framework';
import type { GuildBan } from 'discord.js';

export class UserListener extends Listener {
	public async run({ guild, user }: GuildBan) {
		if (!guild.available || !(await readSettings(guild, GuildSettings.Events.BanAdd))) return;

		const moderation = getModeration(guild);
		await moderation.waitLock();
		await moderation
			.create({
				userId: user.id,
				moderatorId: process.env.CLIENT_ID,
				type: TypeCodes.Ban
			})
			.create();
	}
}
