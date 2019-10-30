import { User, GuildMember } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { ModerationCommand } from '../../lib/structures/ModerationCommand';
import { GuildSettings } from '../../lib/types/settings/GuildSettings';
import { Moderation } from '../../lib/util/constants';

export default class extends ModerationCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.tget('COMMAND_BAN_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_BAN_EXTENDED'),
			flagSupport: true,
			modType: Moderation.TypeCodes.Ban,
			optionalDuration: true,
			permissionLevel: 5,
			requiredMember: false,
			requiredGuildPermissions: ['BAN_MEMBERS']
		});
	}

	public prehandle(message: KlasaMessage) {
		return message.guild!.settings.get(GuildSettings.Events.BanAdd) ? { unlock: message.guild!.moderation.createLock() } : null;
	}

	public async handle(message: KlasaMessage, target: User, _member: GuildMember, reason: string | null, _prehandled: Unlock, duration: number | null) {
		const extraData = await message.guild!.security.actions.ban(target.id, Number(message.flagArgs.day || message.flagArgs.days) || 0, reason);
		return this.sendModlog(message, target, reason, extraData, duration);
	}

	public posthandle(_: KlasaMessage, __: User[], ___: string, prehandled: Unlock) {
		if (prehandled) prehandled.unlock();
	}

	public async checkModeratable(message: KlasaMessage, target: User, prehandled: Unlock) {
		const member = await super.checkModeratable(message, target, prehandled);
		if (member && !member.bannable) throw message.language.tget('COMMAND_BAN_NOT_BANNABLE');
		return member;
	}

}

interface Unlock {
	unlock(): void;
}
