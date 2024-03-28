import { GuildSettings, readSettings } from '#lib/database';
import { getModeration } from '#utils/functions';
import { TypeVariation } from '#utils/moderationConstants';
import { Listener } from '@sapphire/framework';
import type { GuildBan } from 'discord.js';

export class UserListener extends Listener {
	public async run({ guild, user }: GuildBan) {
		if (!guild.available || !(await readSettings(guild, GuildSettings.Events.BanAdd))) return;

		const moderation = getModeration(guild);
		await moderation.waitLock();

		if (moderation.checkSimilarEntryHasBeenCreated(TypeVariation.Ban, user.id)) return;
		await moderation.insert(moderation.create({ user: user.id, type: TypeVariation.Ban }));
	}
}
