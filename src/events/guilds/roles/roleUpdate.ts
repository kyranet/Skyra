import { Event } from '@sapphire/framework';
import type { Role } from 'discord.js';

export class UserEvent extends Event {
	public run(previous: Role, role: Role) {
		if (!role.guild.available) return;
		if (previous.position === role.position) return;
		if (!role.client.settings.guilds.get(role.guild.id)?.permissionNodes.has(role.id)) return;
		return role.guild.writeSettings((settings) => settings.adders.refresh());
	}
}
