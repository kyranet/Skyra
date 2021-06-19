import { GuildSettings } from '#lib/database';
// @ts-expect-error This is a namespace + const enum import
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
				moderatorID: process.env.CLIENT_ID,
				type: Moderation.TypeCodes.UnBan
			})
			.create();
	}
}
