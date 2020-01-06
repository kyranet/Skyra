import { PermissionsNode } from '@lib/types/settings/GuildSettings';
import { GuildMember, Role } from 'discord.js';
import { Command, Serializer, SerializerUpdateContext, util } from 'klasa';

export default class extends Serializer {

	public async validate(data: PermissionsNode, { entry, language, guild }: SerializerUpdateContext) {
		if (guild === null) throw new TypeError('guild must not be null.');

		// Safe-guard checks against arbitrary data
		if (!util.isObject(data)) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID');
		if (Object.keys(data).length !== 3) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID');
		if (typeof data.id !== 'string') throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID');
		if (!Array.isArray(data.allow)) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID');
		if (!Array.isArray(data.deny)) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID');

		// Check for target validity
		let target: GuildMember | Role;
		if (entry.key === 'roles') {
			const role = guild.roles.get(data.id);
			if (!role) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_TARGET');
			target = role;
		} else {
			target = await guild.members.fetch(data.id)
				.catch(() => { throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_TARGET'); });
		}

		// The @everyone role should not have allows
		if (target.id === guild.id && data.allow.length !== 0) {
			throw language.tget('SERIALIZER_PERMISSION_NODE_SECURITY_EVERYONE_ALLOWS');
		}

		// The owner cannot have allows nor denies
		if (target.id === guild.ownerID) {
			throw language.tget('SERIALIZER_PERMISSION_NODE_SECURITY_OWNER');
		}

		// Check all commands
		const commands = new Map<string, Command>();
		for (const allowed of data.allow) {
			if (commands.has(allowed)) throw language.tget('SERIALIZER_PERMISSION_NODE_DUPLICATED_COMMAND', allowed);

			const command = this.client.commands.get(allowed);
			if (!command) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_COMMAND', allowed);
			if (command.permissionLevel >= 9) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_COMMAND', allowed);
			commands.set(allowed, command);
		}

		for (const denied of data.deny) {
			if (commands.has(denied)) throw language.tget('SERIALIZER_PERMISSION_NODE_DUPLICATED_COMMAND', denied);

			const command = this.client.commands.get(denied);
			if (!command) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_COMMAND', denied);
			if (command.permissionLevel >= 9) throw language.tget('SERIALIZER_PERMISSION_NODE_INVALID_COMMAND', denied);
			if (command.guarded) throw language.tget('SERIALIZER_PERMISSION_NODE_SECURITY_GUARDED', denied);
			commands.set(denied, command);
		}

		return data;
	}

	public stringify(value: PermissionsNode) {
		return `${value.id}(${value.allow.join(', ')} | ${value.deny.join(', ')})`;
	}

}
