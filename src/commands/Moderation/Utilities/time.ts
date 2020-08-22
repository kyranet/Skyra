import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { ModerationEntity } from '@orm/entities/ModerationEntity';
import { Moderation } from '@utils/constants';
import { Permissions, User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			cooldown: 5,
			description: 'Sets a timer.',
			permissionLevel: PermissionLevels.Moderator,
			runIn: ['text'],
			usage: '[cancel] <case:integer> (timer:timer)',
			usageDelim: ' '
		});

		this.createCustomResolver('timer', async (arg, possible, message, [cancel]) => {
			if (cancel === 'cancel') return null;
			if (!arg) throw message.language.get('COMMAND_TIME_UNDEFINED_TIME');

			const restString = (await this.client.arguments.get('...string')!.run(arg, possible, message)) as string;
			return this.client.arguments.get('timespan')!.run(restString, possible, message);
		});
	}

	public async run(message: KlasaMessage, [cancel, caseID, duration]: ['cancel', number | 'latest', number | null]) {
		if (caseID === 'latest') caseID = await message.guild!.moderation.count();

		const entry = await message.guild!.moderation.fetch(caseID);
		if (!entry) throw message.language.get('MODERATION_CASE_NOT_EXISTS');
		if (!cancel && entry.temporaryType) throw message.language.get('COMMAND_TIME_TIMED');

		const user = await entry.fetchUser();
		await this.validateAction(message, entry, user);
		const task = this.client.schedules.queue.find(
			(tk) => tk.data && tk.data[Moderation.SchemaKeys.Case] === entry.caseID && tk.data[Moderation.SchemaKeys.Guild] === entry.guild.id
		)!;

		if (cancel) {
			if (!task) throw message.language.get('COMMAND_TIME_NOT_SCHEDULED');

			await message.guild!.moderation.fetchChannelMessages();
			await entry.edit({
				duration: null,
				moderatorID: message.author.id
			});

			return message.sendLocale('COMMAND_TIME_ABORTED', [{ title: entry.title }]);
		}

		if (entry.appealType || entry.invalidated) throw message.language.get('MODERATION_LOG_APPEALED');
		if (task) throw message.language.get('MODLOG_TIMED', { remaining: (task.data.timestamp as number) - Date.now() });

		await message.guild!.moderation.fetchChannelMessages();
		await entry.edit({
			duration,
			moderatorID: message.author.id
		});
		return message.sendLocale('COMMAND_TIME_SCHEDULED', [{ title: entry.title, user, time: duration! }]);
	}

	private validateAction(message: KlasaMessage, modlog: ModerationEntity, user: User) {
		switch (modlog.type) {
			case Moderation.TypeCodes.FastTemporaryBan:
			case Moderation.TypeCodes.TemporaryBan:
			case Moderation.TypeCodes.Ban:
				return this.checkBan(message, user);
			case Moderation.TypeCodes.FastTemporaryMute:
			case Moderation.TypeCodes.TemporaryMute:
			case Moderation.TypeCodes.Mute:
				return this.checkMute(message, user);
			case Moderation.TypeCodes.FastTemporaryVoiceMute:
			case Moderation.TypeCodes.TemporaryVoiceMute:
			case Moderation.TypeCodes.VoiceMute:
				return this.checkVMute(message, user);
			case Moderation.TypeCodes.Warning:
			case Moderation.TypeCodes.FastTemporaryWarning:
			case Moderation.TypeCodes.TemporaryWarning:
			// TODO(kyranet): Add checks for restrictions
			case Moderation.TypeCodes.RestrictionAttachment:
			case Moderation.TypeCodes.FastTemporaryRestrictionAttachment:
			case Moderation.TypeCodes.TemporaryRestrictionAttachment:
			case Moderation.TypeCodes.RestrictionEmbed:
			case Moderation.TypeCodes.FastTemporaryRestrictionEmbed:
			case Moderation.TypeCodes.TemporaryRestrictionEmbed:
			case Moderation.TypeCodes.RestrictionEmoji:
			case Moderation.TypeCodes.FastTemporaryRestrictionEmoji:
			case Moderation.TypeCodes.TemporaryRestrictionEmoji:
			case Moderation.TypeCodes.RestrictionReaction:
			case Moderation.TypeCodes.FastTemporaryRestrictionReaction:
			case Moderation.TypeCodes.TemporaryRestrictionReaction:
			case Moderation.TypeCodes.RestrictionVoice:
			case Moderation.TypeCodes.FastTemporaryRestrictionVoice:
			case Moderation.TypeCodes.TemporaryRestrictionVoice:
				return;
			default:
				throw message.language.get('COMMAND_TIME_UNSUPPORTED_TIPE');
		}
	}

	private async checkBan(message: KlasaMessage, user: User) {
		if (!message.guild!.me!.permissions.has(Permissions.FLAGS.BAN_MEMBERS)) throw message.language.get('COMMAND_UNBAN_MISSING_PERMISSION');
		if (!(await message.guild!.security.actions.userIsBanned(user))) throw message.language.get('GUILD_BANS_NOT_FOUND');
	}

	private checkMute(message: KlasaMessage, user: User) {
		if (!message.guild!.me!.permissions.has(Permissions.FLAGS.MANAGE_ROLES)) throw message.language.get('COMMAND_UNMUTE_MISSING_PERMISSION');
		if (!message.guild!.security.actions.userIsMuted(user)) throw message.language.get('COMMAND_MUTE_USER_NOT_MUTED');
	}

	private async checkVMute(message: KlasaMessage, user: User) {
		if (!message.guild!.me!.permissions.has(Permissions.FLAGS.MUTE_MEMBERS)) throw message.language.get('COMMAND_VMUTE_MISSING_PERMISSION');
		if (!(await message.guild!.security.actions.userIsVoiceMuted(user))) throw message.language.get('COMMAND_VMUTE_USER_NOT_MUTED');
	}
}
