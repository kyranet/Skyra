import { User, GuildMember } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { ModerationCommand } from '../../lib/structures/ModerationCommand';
import { Moderation } from '../../lib/util/constants';

export default class extends ModerationCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: language => language.tget('COMMAND_VMUTE_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_VMUTE_EXTENDED'),
			modType: Moderation.TypeCodes.VoiceMute,
			optionalDuration: true,
			permissionLevel: 5,
			requiredMember: true,
			requiredGuildPermissions: ['MUTE_MEMBERS']
		});
	}

	public async prehandle() { /* Do nothing */ }

	public async handle(message: KlasaMessage, user: User, member: GuildMember, reason: string, _prehandled: undefined, duration: number | null) {
		await member.voice.setMute(true, reason);
		return this.sendModlog(message, user, reason, null, duration);
	}

	public async posthandle() { /* Do nothing */ }

	public async checkModeratable(message: KlasaMessage, target: User, prehandled: unknown) {
		const member = await super.checkModeratable(message, target, prehandled);
		if (member && member.voice.serverMute) throw message.language.tget('COMMAND_MUTE_MUTED');
		return member;
	}

}
