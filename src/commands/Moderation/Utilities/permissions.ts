import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import { ZeroWidthSpace } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { send } from '@sapphire/plugin-editable-commands';
import { MessageEmbed, Permissions, PermissionString } from 'discord.js';
import { PermissionFlagsBits } from 'discord-api-types/payloads/v9';

const PERMISSION_FLAGS = Object.keys(Permissions.FLAGS) as PermissionString[];

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Moderation.PermissionsDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.PermissionsExtended,
	permissionLevel: PermissionLevels.Administrator,
	requiredClientPermissions: [PermissionFlagsBits.EmbedLinks],
	runIn: [CommandOptionsRunTypeEnum.GuildAny]
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const user = args.finished ? message.author : await args.pick('userName');
		const member = await message.guild.members.fetch(user.id).catch(() => {
			this.error(LanguageKeys.Misc.UserNotInGuild);
		});

		const { permissions } = member;
		const list = [ZeroWidthSpace];

		if (permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
			list.push(args.t(LanguageKeys.Commands.Moderation.PermissionsAll));
		} else {
			for (const flag of PERMISSION_FLAGS) {
				list.push(`${permissions.has(flag) ? '🔹' : '🔸'} ${args.t(`permissions:${flag}`, flag)}`);
			}
		}

		const embed = new MessageEmbed()
			.setColor(await this.container.db.fetchColor(message))
			.setTitle(args.t(LanguageKeys.Commands.Moderation.Permissions, { username: user.tag, id: user.id }))
			.setDescription(list.join('\n'));
		return send(message, { embeds: [embed] });
	}
}
