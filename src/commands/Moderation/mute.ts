import { Permissions, TextChannel, User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraGuildMember } from '../../lib/extensions/SkyraGuildMember';
import { ModerationCommand } from '../../lib/structures/ModerationCommand';
import { GuildSettings } from '../../lib/types/settings/GuildSettings';
import { ModerationTypeKeys } from '../../lib/util/constants';
import { createMuteRole, mute } from '../../lib/util/util';

const PERMISSIONS = Permissions.resolve([
	Permissions.FLAGS.MANAGE_ROLES,
	Permissions.FLAGS.MANAGE_CHANNELS
]);

export default class extends ModerationCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.get('COMMAND_MUTE_DESCRIPTION'),
			extendedHelp: language => language.get('COMMAND_MUTE_EXTENDED'),
			modType: ModerationTypeKeys.Mute,
			permissionLevel: 5,
			requiredMember: true,
			requiredPermissions: ['MANAGE_ROLES']
		});
	}

	public async inhibit(message: KlasaMessage) {
		if (message.command !== this) return false;
		const id = message.guild!.settings.get(GuildSettings.Roles.Muted) as GuildSettings.Roles.Muted;
		const role = (id && message.guild!.roles.get(id)) || null;
		if (!role) {
			if (!await message.hasAtLeastPermissionLevel(6)) throw message.language.get('COMMAND_MUTE_LOWLEVEL');
			if (!(message.channel as TextChannel).permissionsFor(message.guild!.me!)!.has(PERMISSIONS)) throw message.language.get('COMMAND_MUTECREATE_MISSING_PERMISSION');
			if (message.guild!.roles.size >= 250) throw message.language.get('COMMAND_MUTE_CONFIGURE_TOOMANY_ROLES');
			await message.ask(message.language.get('COMMAND_MUTE_CONFIGURE'))
				.catch(() => { throw message.language.get('COMMAND_MUTE_CONFIGURE_CANCELLED'); });
			await message.sendLocale('SYSTEM_LOADING');
			await createMuteRole(message);
		}

		return false;
	}

	public async prehandle() { /* Do nothing */ }

	public async handle(message: KlasaMessage, _: User, member: SkyraGuildMember, reason: string) {
		return mute(message.member!, member, reason);
	}

	public async posthandle() { /* Do nothing */ }

}
