import { GuildSettings } from '#lib/database';
import { CLIENT_ID } from '#root/config';
import { Moderation } from '#utils/constants';
import { Event } from '@sapphire/framework';
import type { Guild, User } from 'discord.js';

export class UserEvent extends Event {
	public async run(guild: Guild, user: User) {
		if (!guild.available || !(await guild.readSettings(GuildSettings.Events.BanRemove))) return;
		await guild.moderation.waitLock();
		await guild.moderation
			.create({
				userID: user.id,
				moderatorID: CLIENT_ID,
				type: Moderation.TypeCodes.UnBan
			})
			.create();
	}
}
