import { MessageEmbed, Permissions, Role } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { BrandingColors } from '@util/constants';
import { PermissionLevels } from '@lib/types/Enums';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			cooldown: 10,
			description: language => language.tget('COMMAND_ROLEINFO_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_ROLEINFO_EXTENDED'),
			permissionLevel: PermissionLevels.Moderator,
			requiredPermissions: ['EMBED_LINKS'],
			runIn: ['text'],
			usage: '[role:rolename]'
		});
	}

	public run(message: KlasaMessage, [role = message.member!.roles.highest]: [Role?]) {
		const roleInfoTitles = message.language.tget('COMMAND_ROLEINFO_TITLES') as unknown as RoleInfoTitles;
		const { permissions } = role;
		return message.sendEmbed(new MessageEmbed()
			.setColor(role.color || BrandingColors.Secondary)
			.setTitle(`${role.name} [${role.id}]`)
			.setDescription(message.language.tget('COMMAND_ROLEINFO', role))
			.addField(roleInfoTitles.PERMISSIONS, permissions.has(Permissions.FLAGS.ADMINISTRATOR)
				? message.language.tget('COMMAND_ROLEINFO_ALL')
				: message.language.tget('COMMAND_ROLEINFO_PERMISSIONS', permissions.toArray())));
	}

}

interface RoleInfoTitles {
	PERMISSIONS: string;
}
