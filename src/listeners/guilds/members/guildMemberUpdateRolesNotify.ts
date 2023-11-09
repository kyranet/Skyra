import { GuildSettings, readSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { Events } from '#lib/types';
import { Colors } from '#utils/constants';
import { getFullEmbedAuthor } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { TFunction } from '@sapphire/plugin-i18next';
import { isNullish } from '@sapphire/utilities';
import { EmbedBuilder, GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberUpdate })
export class UserListener extends Listener {
	public async run(previous: GuildMember, next: GuildMember) {
		const key = GuildSettings.Channels.Logs.MemberRoleUpdate;
		const [logChannelId, t] = await readSettings(next, (settings) => [settings[key], settings.getLanguage()]);
		if (isNullish(logChannelId)) return;

		// Retrieve whether or not role logs should be sent from Guild Settings and
		// whether or not the roles are the same.
		const prevRoles = previous.roles.cache;
		const nextRoles = next.roles.cache;
		if (prevRoles.equals(nextRoles)) return;

		const addedRoles: string[] = [];
		const removedRoles: string[] = [];

		// Check which roles are added and which are removed and
		// get the names of each role for logging
		for (const [key, role] of nextRoles.entries()) {
			if (!prevRoles.has(key)) addedRoles.push(`\`${role.name}\``);
		}

		for (const [key, role] of prevRoles.entries()) {
			if (!nextRoles.has(key)) removedRoles.push(`\`${role.name}\``);
		}

		const { user } = next;

		// Set the Role change log
		this.container.client.emit(Events.GuildMessageLog, next.guild, logChannelId, key, () =>
			new EmbedBuilder()
				.setColor(Colors.Yellow)
				.setAuthor(getFullEmbedAuthor(user))
				.setDescription(this.getRoleDescription(t, addedRoles, removedRoles) || t(LanguageKeys.Events.Guilds.Members.GuildMemberNoUpdate))
				.setFooter({ text: t(LanguageKeys.Events.Guilds.Members.RoleUpdate) })
				.setTimestamp()
		);
	}

	private getRoleDescription(t: TFunction, addedRoles: string[], removedRoles: string[]) {
		const description = [];
		if (addedRoles.length) {
			description.push(
				t(LanguageKeys.Events.Guilds.Members.GuildMemberAddedRoles, {
					addedRoles,
					count: addedRoles.length
				})
			);
		}

		if (removedRoles.length) {
			description.push(t(LanguageKeys.Events.Guilds.Members.GuildMemberRemovedRoles, { removedRoles, count: removedRoles.length }));
		}

		return description.join('\n');
	}
}
