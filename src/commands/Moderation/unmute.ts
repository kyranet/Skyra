import { Role, User, GuildMember } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { ModerationCommand } from '../../lib/structures/ModerationCommand';
import { GuildSettings } from '../../lib/types/settings/GuildSettings';
import { Moderation } from '../../lib/util/constants';
import { removeMute } from '../../lib/util/util';

export default class extends ModerationCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.tget('COMMAND_UNMUTE_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_UNMUTE_EXTENDED'),
			modType: Moderation.TypeCodes.UnMute,
			permissionLevel: 5,
			requiredMember: true,
			requiredGuildPermissions: ['MANAGE_ROLES']
		});
	}

	public inhibit(message: KlasaMessage) {
		const id = message.guild!.settings.get(GuildSettings.Roles.Muted);
		if (id && message.guild!.roles.has(id)) return false;
		throw message.language.tget('GUILD_SETTINGS_ROLES_MUTED');
	}

	public async prehandle() { /* Do nothing */ }

	public async handle(message: KlasaMessage, user: User, member: GuildMember, reason: string) {
		const modlog = (await message.guild!.moderation.fetch(user.id))
			.filter(log => !log.invalidated && log.isType(Moderation.TypeCodes.Mute))
			.last();
		if (!modlog) throw message.language.tget('GUILD_MUTE_NOT_FOUND');
		await removeMute(member.guild, member.id);

		// Cache and concatenate with the current roles
		const { position } = message.guild!.me!.roles.highest;
		const rawRoleIDs = modlog.extraData as string[] || [];
		const rawRoles = rawRoleIDs.map(id => message.guild!.roles.get(id)).filter(role => role) as Role[];
		const roles = new Set(member.roles.keys());
		for (const rawRole of rawRoles) {
			if (rawRole.position < position) roles.add(rawRole.id);
		}

		// Remove the muted role
		roles.delete(message.guild!.settings.get(GuildSettings.Roles.Muted));

		// Edit roles
		await member.edit({ roles: [...roles] });
		await modlog.invalidate();
		return this.sendModlog(message, user, reason);
	}

	public async posthandle() { /* Do nothing */ }

	public async checkModeratable(message: KlasaMessage, target: User, prehandled: unknown) {
		const modlog = (await message.guild!.moderation.fetch(target.id))
			.filter(log => !log.invalidated && log.isType(Moderation.TypeCodes.Mute))
			.last();
		if (!modlog) throw message.language.tget('GUILD_MUTE_NOT_FOUND');
		const member = await super.checkModeratable(message, target, prehandled);
		return member;
	}

}
