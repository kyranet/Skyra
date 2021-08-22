import { GuildSettings, readSettings } from '#lib/database';
import { api } from '#lib/discord/Api';
import { floatPromise } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import {
	AuditLogEvent,
	GatewayDispatchEvents,
	GatewayGuildMemberUpdateDispatch,
	RESTGetAPIAuditLogQuery,
	RESTGetAPIAuditLogResult
} from 'discord-api-types/v9';
import { Guild, Permissions } from 'discord.js';

@ApplyOptions<ListenerOptions>({ event: GatewayDispatchEvents.GuildMemberUpdate, emitter: 'ws' })
export class UserListener extends Listener {
	private readonly requiredPermissions = new Permissions(Permissions.FLAGS.VIEW_AUDIT_LOG);

	public run(data: GatewayGuildMemberUpdateDispatch['d']) {
		const guild = this.container.client.guilds.cache.get(data.guild_id);

		// If the guild does not exist for some reason, skip:
		if (typeof guild === 'undefined') return;

		// If the bot doesn't have the required permissions, skip:
		if (!guild.me!.permissions.has(this.requiredPermissions)) return;

		floatPromise(this.handleRoleSets(guild, data));
	}

	private async handleRoleSets(guild: Guild, data: Readonly<GatewayGuildMemberUpdateDispatch['d']>) {
		// Handle unique role sets
		let hasMultipleRolesInOneSet = false;
		const allRoleSets = await readSettings(guild, GuildSettings.Roles.UniqueRoleSets);

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

		const query: RESTGetAPIAuditLogQuery = {
			limit: 10,
			action_type: AuditLogEvent.MemberRoleUpdate
		};
		const auditLogs = await api().guilds(guild.id)['audit-logs'].get<RESTGetAPIAuditLogResult>({
			query
		});

		const updatedRoleId = this.getChange(auditLogs, data.user!.id);
		if (updatedRoleId === null) return;

		let memberRoles = data.roles;
		for (const set of allRoleSets) {
			if (set.roles.includes(updatedRoleId)) memberRoles = memberRoles.filter((id) => !set.roles.includes(id) || id === updatedRoleId);
		}

		await api()
			.guilds(guild.id)
			.members(data.user!.id)
			.patch({ data: { roles: memberRoles }, reason: 'Automatic Role Group Modification' });
	}

	private getChange(results: RESTGetAPIAuditLogResult, userId: string): string | null {
		// Scan the audit logs.
		for (const result of results.audit_log_entries) {
			// If it was given by Skyra, continue.
			if (result.user_id === process.env.CLIENT_ID) continue;

			// If the target isn't the edited user, continue.
			if (result.target_id !== userId) continue;

			// If there are no changes, continue.
			if (typeof result.changes === 'undefined') continue;

			// Scan the changes.
			for (const change of result.changes) {
				if (change.key === '$add') return change.new_value![0].id;
			}
		}

		// No changes found.
		return null;
	}
}
