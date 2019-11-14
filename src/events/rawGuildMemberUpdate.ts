import { WSGuildMemberUpdate, AuditLogResult } from '../lib/types/DiscordAPI';
import { Event, EventStore, KlasaGuild } from 'klasa';
import { GuildSettings } from '../lib/types/settings/GuildSettings';
import { api } from '../lib/util/Models/Api';
import { MessageEmbed } from 'discord.js';
import { floatPromise, getDisplayAvatar } from '../lib/util/util';
import { Events } from '../lib/types/Enums';
import { MessageLogsEnum } from '../lib/util/constants';

export default class extends Event {

	public constructor(store: EventStore, file: string[], directory: string) {
		super(store, file, directory, { name: 'GUILD_MEMBER_UPDATE', emitter: store.client.ws });
	}

	public run(data: WSGuildMemberUpdate) {
		const guild = this.client.guilds.get(data.guild_id);
		if (typeof guild === 'undefined') return;

		this.handleNicknameChange(guild, data);
		floatPromise(this, this.handleRoleSets(guild, data));
	}

	private handleNicknameChange(guild: KlasaGuild, data: WSGuildMemberUpdate) {
		// Get the previous nickname
		const previous = guild.nicknames.get(data.user.id);
		if (typeof previous === 'undefined') return;

		// Get the current nickname, compare them both, if they are different, it changed
		const next = data.nick;
		if (previous === next) return;

		guild.nicknames.set(data.user.id, next);
		this.client.emit(Events.GuildMessageLog, MessageLogsEnum.Member, guild, () => new MessageEmbed()
			.setColor(0xDCE775)
			.setAuthor(`${data.user.username}#${data.user.discriminator} (${data.user.id})`, getDisplayAvatar(data.user.id, data.user))
			.setDescription(guild.language.tget('EVENTS_NICKNAME_DIFFERENCE', previous, next))
			.setFooter(guild.language.tget('EVENTS_NICKNAME_UPDATE'))
			.setTimestamp());
	}

	private async handleRoleSets(guild: KlasaGuild, data: WSGuildMemberUpdate) {
		// Handle unique role sets
		let hasMultipleRolesInOneSet = false;
		const allRoleSets = guild.settings.get(GuildSettings.Roles.UniqueRoleSets);

		// First check if the user has multiple roles from a set
		for (const set of allRoleSets) {
			let hasOneRole = false;
			for (const id of set.roles) {
				if (!data.roles.includes(id)) continue;

				if (hasOneRole) {
					hasMultipleRolesInOneSet = true;
					break;
				} else {
					hasOneRole = true;
				}
			}
			// If we already know the member has multiple roles break the loop
			if (hasMultipleRolesInOneSet) break;
		}

		// If the user does not have multiple roles from any set cancel
		if (!hasMultipleRolesInOneSet) return;

		const auditLogs = await api(this.client).guilds(guild.id)['audit-logs'].get({
			query: {
				limit: 10,
				action_type: 25
			}
		}) as AuditLogResult;

		const entry = auditLogs.audit_log_entries.find(e => e.user_id !== this.client.user!.id
			&& e.target_id === data.user.id
			&& e.changes.find(c => c.key === '$add' && c.new_value.length));
		if (typeof entry === 'undefined') return;

		const change = entry.changes.find(c => c.key === '$add' && c.new_value.length)!;
		const updatedRoleID = change.new_value[0].id;
		let memberRoles = data.roles;
		for (const set of allRoleSets) {
			if (set.roles.includes(updatedRoleID)) memberRoles = memberRoles.filter(id => !set.roles.includes(id) || id === updatedRoleID);
		}

		await api(this.client).guilds(guild.id).members(data.user.id)
			.patch({ data: { roles: memberRoles }, reason: 'Automatic Role Group Modification' });
	}

}
