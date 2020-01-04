import { KlasaClient } from 'klasa';
import { Permissions } from 'discord.js';
import { PermissionLevels } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';

export default KlasaClient.defaultPermissionLevels
	.add(PermissionLevels.Moderator, message => message.member
		? message.guild!.settings.get(GuildSettings.Roles.Moderator)
			? message.member.roles.has(message.guild!.settings.get(GuildSettings.Roles.Moderator))
			: message.member.permissions.has(Permissions.FLAGS.BAN_MEMBERS)
		: false, { fetch: true })
	.add(PermissionLevels.Administrator, message => message.member
		? message.guild!.settings.get(GuildSettings.Roles.Admin)
			? message.member.roles.has(message.guild!.settings.get(GuildSettings.Roles.Admin))
			: message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)
		: false, { fetch: true });
