import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { ZeroWidhSpace } from '@utils/constants';
import { MessageEmbed, Permissions, PermissionString, User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

const PERMISSION_FLAGS = Object.keys(Permissions.FLAGS) as PermissionString[];

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: 'Check the permission for a member, or yours.',
			permissionLevel: PermissionLevels.Administrator,
			requiredPermissions: ['EMBED_LINKS'],
			runIn: ['text'],
			usage: '[member:username]'
		});
	}

	public async run(message: KlasaMessage, [user = message.author]: [User]) {
		if (!user) throw message.language.get('USER_NOT_EXISTENT');
		const member = await message.guild!.members.fetch(user.id).catch(() => {
			throw message.language.get('USER_NOT_IN_GUILD');
		});

		const { permissions } = member;
		const list = [ZeroWidhSpace];
		if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
			list.push(message.language.get('COMMAND_PERMISSIONS_ALL'));
		} else {
			for (const flag of PERMISSION_FLAGS) {
				list.push(`${permissions.has(flag) ? '🔹' : '🔸'} ${message.language.PERMISSIONS[flag] || flag}`);
			}
		}

		const embed = new MessageEmbed()
			.setColor(await DbSet.fetchColor(message))
			.setTitle(message.language.get('COMMAND_PERMISSIONS', { username: user.tag, id: user.id }))
			.setDescription(list.join('\n'));

		return message.sendMessage({ embed });
	}
}
