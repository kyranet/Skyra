import type { GuildEntity, ModerationEntity } from '#lib/database/entities';
import { GuildSettings } from '#lib/database/keys';
import { readSettings, writeSettings } from '#lib/database/settings';
import { api } from '#lib/discord/Api';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { ModerationManagerCreateData } from '#lib/moderation';
import { resolveOnErrorCodes } from '#utils/common';
import { getModeration, getStickyRoles, promptConfirmation } from '#utils/functions';
import { TypeCodes } from '#utils/moderationConstants';
import { isCategoryChannel, isNewsChannel, isStageChannel, isTextChannel, isVoiceChannel } from '@sapphire/discord.js-utilities';
import { container, UserError } from '@sapphire/framework';
import { fetchT, resolveKey } from '@sapphire/plugin-i18next';
import { isNullish, isNullishOrEmpty, isNullishOrZero, Nullish, PickByValue } from '@sapphire/utilities';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import {
	DiscordAPIError,
	Guild,
	GuildChannel,
	GuildMember,
	Message,
	MessageEmbed,
	PermissionOverwriteOptions,
	Permissions,
	Role,
	RoleData,
	User
} from 'discord.js';
import type { TFunction } from 'i18next';

export const enum ModerationSetupRestriction {
	All = 'rolesMuted',
	Reaction = 'rolesRestrictedReaction',
	Embed = 'rolesRestrictedEmbed',
	Emoji = 'rolesRestrictedEmoji',
	Attachment = 'rolesRestrictedAttachment',
	Voice = 'rolesRestrictedVoice'
}

const enum RoleDataKey {
	Muted,
	Reaction,
	Embed,
	Emoji,
	Attachment,
	Voice
}

const kRoleDataOptions = new Map<RoleDataKey, RoleData>([
	[
		RoleDataKey.Muted,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Muted',
			permissions: []
		}
	],
	[
		RoleDataKey.Attachment,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Restricted Attachment',
			permissions: []
		}
	],
	[
		RoleDataKey.Embed,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Restricted Embed',
			permissions: []
		}
	],
	[
		RoleDataKey.Emoji,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Restricted Emoji',
			permissions: []
		}
	],
	[
		RoleDataKey.Reaction,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Restricted Reaction',
			permissions: []
		}
	],
	[
		RoleDataKey.Voice,
		{
			color: 0x000000,
			hoist: false,
			mentionable: false,
			name: 'Restricted Voice',
			permissions: []
		}
	]
]);

const kRoleChannelOverwriteOptions = new Map<RoleDataKey, RolePermissionOverwriteOption>([
	[
		RoleDataKey.Muted,
		{
			category: {
				options: {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false,
					CONNECT: false
				},
				permissions: new Permissions(['SEND_MESSAGES', 'ADD_REACTIONS', 'CONNECT'])
			},
			text: {
				options: {
					SEND_MESSAGES: false,
					ADD_REACTIONS: false
				},
				permissions: new Permissions(['SEND_MESSAGES', 'ADD_REACTIONS'])
			},
			voice: {
				options: {
					CONNECT: false
				},
				permissions: new Permissions(['CONNECT'])
			}
		}
	],
	[
		RoleDataKey.Attachment,
		{
			category: {
				options: {
					ATTACH_FILES: false
				},
				permissions: new Permissions(['ATTACH_FILES'])
			},
			text: {
				options: {
					ATTACH_FILES: false
				},
				permissions: new Permissions(['ATTACH_FILES'])
			},
			voice: null
		}
	],
	[
		RoleDataKey.Embed,
		{
			category: {
				options: {
					EMBED_LINKS: false
				},
				permissions: new Permissions(['EMBED_LINKS'])
			},
			text: {
				options: {
					EMBED_LINKS: false
				},
				permissions: new Permissions(['EMBED_LINKS'])
			},
			voice: null
		}
	],
	[
		RoleDataKey.Emoji,
		{
			category: {
				options: {
					USE_EXTERNAL_EMOJIS: false
				},
				permissions: new Permissions(['USE_EXTERNAL_EMOJIS'])
			},
			text: {
				options: {
					USE_EXTERNAL_EMOJIS: false
				},
				permissions: new Permissions(['USE_EXTERNAL_EMOJIS'])
			},
			voice: null
		}
	],
	[
		RoleDataKey.Reaction,
		{
			category: {
				options: {
					ADD_REACTIONS: false
				},
				permissions: new Permissions(['ADD_REACTIONS'])
			},
			text: {
				options: {
					ADD_REACTIONS: false
				},
				permissions: new Permissions(['ADD_REACTIONS'])
			},
			voice: null
		}
	],
	[
		RoleDataKey.Voice,
		{
			category: {
				options: {
					CONNECT: false
				},
				permissions: new Permissions(['CONNECT'])
			},
			text: null,
			voice: {
				options: {
					CONNECT: false
				},
				permissions: new Permissions(['CONNECT'])
			}
		}
	]
]);

export interface ModerationAction {
	addRole: string;
	mute: string;
	ban: string;
	kick: string;
	softban: string;
	vkick: string;
	vmute: string;
	restrictedReact: string;
	restrictedEmbed: string;
	restrictedAttachment: string;
	restrictedVoice: string;
	setNickname: string;
	removeRole: string;
}

export class ModerationActions {
	public guild: Guild;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	private get manageableChannelCount() {
		return this.guild.channels.cache.reduce((acc, channel) => (channel.manageable ? acc + 1 : acc), 0);
	}

	public async warning(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.Warning);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		return (await moderationLog.create())!;
	}

	public async unWarning(rawOptions: ModerationActionOptions, caseId: number, sendOptions?: ModerationActionsSendOptions) {
		const oldModerationLog = await getModeration(this.guild).fetch(caseId);
		if (oldModerationLog === null || !oldModerationLog.isType(TypeCodes.Warning))
			throw await resolveKey(this.guild, LanguageKeys.Commands.Moderation.GuildWarnNotFound);

		await oldModerationLog.invalidate();
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnWarn);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		return (await moderationLog.create())!;
	}

	public async setNickname(rawOptions: ModerationActionOptions, nickname: string, sendOptions?: ModerationActionsSendOptions) {
		const oldName = this.guild.members.cache.get(rawOptions.userId)?.nickname || '';
		const options = ModerationActions.fillOptions({ ...rawOptions, extraData: { oldName } }, TypeCodes.SetNickname);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.members(rawOptions.userId)
			.patch({
				data: { nick: nickname },
				reason: moderationLog.reason
					? await resolveKey(
							this.guild,
							nickname
								? LanguageKeys.Commands.Moderation.ActionSetNicknameSet
								: LanguageKeys.Commands.Moderation.ActionSetNicknameRemoved,
							{ reason: moderationLog.reason }
					  )
					: await resolveKey(
							this.guild,
							nickname
								? LanguageKeys.Commands.Moderation.ActionSetNicknameNoReasonSet
								: LanguageKeys.Commands.Moderation.ActionSetNicknameNoReasonRemoved
					  )
			});

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.SetNickname);
		return (await moderationLog.create())!;
	}

	public async unSetNickname(rawOptions: ModerationActionOptions, nickname: string, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnSetNickname);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.members(rawOptions.userId)
			.patch({ data: { nick: nickname }, reason: rawOptions.reason });

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.SetNickname);
		return (await moderationLog.create())!;
	}

	public async addRole(rawOptions: ModerationActionOptions, role: Role, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions({ ...rawOptions, extraData: { role: role.id } }, TypeCodes.AddRole);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.members(rawOptions.userId)
			.roles(role.id)
			.put({
				reason: await this.getReason('addRole', moderationLog.reason)
			});

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.AddRole, (log) => (log.extraData as { role?: string })?.role === role.id);
		return (await moderationLog.create())!;
	}

	public async unAddRole(rawOptions: ModerationActionOptions, role: Role, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnAddRole);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api().guilds(this.guild.id).members(rawOptions.userId).roles(role.id).delete({ reason: rawOptions.reason! });

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.AddRole, (log) => (log.extraData as { role?: string })?.role === role.id);
		return (await moderationLog.create())!;
	}

	public async removeRole(rawOptions: ModerationActionOptions, role: Role, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions({ ...rawOptions, extraData: { role: role.id } }, TypeCodes.RemoveRole);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.members(rawOptions.userId)
			.roles(role.id)
			.delete({ reason: await this.getReason('removeRole', moderationLog.reason) });

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RemoveRole, (log) => (log.extraData as { role?: string })?.role === role.id);
		return (await moderationLog.create())!;
	}

	public async unRemoveRole(rawOptions: ModerationActionOptions, role: Role, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRemoveRole);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api().guilds(this.guild.id).members(rawOptions.userId).roles(role.id).put({ reason: rawOptions.reason });

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RemoveRole, (log) => (log.extraData as { role?: string })?.role === role.id);
		return (await moderationLog.create())!;
	}

	public async mute(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyMute(rawOptions.userId);
		const extraData = await this.muteUser(rawOptions);
		const options = ModerationActions.fillOptions({ ...rawOptions, extraData }, TypeCodes.Mute);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.Mute);
		return (await moderationLog.create())!;
	}

	public async unMute(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnMute);
		await this.removeStickyMute(options.userId);
		const oldModerationLog = await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.Mute);
		if (typeof oldModerationLog === 'undefined') {
			throw await resolveKey(this.guild, LanguageKeys.Commands.Moderation.MuteNotExists);
		}

		// If Skyra does not have permissions to manage permissions, abort.
		if (!(await this.fetchMe()).permissions.has(Permissions.FLAGS.MANAGE_ROLES)) {
			throw await resolveKey(this.guild, LanguageKeys.Commands.Moderation.MuteCannotManageRoles);
		}

		await this.unmuteUser(options, oldModerationLog);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		return (await moderationLog.create())!;
	}

	public async kick(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.Kick);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.members(options.userId)
			.delete({
				reason: await this.getReason('kick', moderationLog.reason)
			});
		return (await moderationLog.create())!;
	}

	public async softBan(rawOptions: ModerationActionOptions, days: number, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.SoftBan);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		const t = await fetchT(this.guild);
		await api()
			.guilds(this.guild.id)
			.bans(options.userId)
			.put({
				data: {
					delete_message_days: days
				},
				reason: moderationLog.reason
					? t(LanguageKeys.Commands.Moderation.ActionSoftBanReason, { reason: moderationLog.reason! })
					: t(LanguageKeys.Commands.Moderation.ActionSoftBanNoReason)
			});
		await api()
			.guilds(this.guild.id)
			.bans(options.userId)
			.delete({
				reason: moderationLog.reason
					? t(LanguageKeys.Commands.Moderation.ActionUnSoftBanReason, { reason: moderationLog.reason! })
					: t(LanguageKeys.Commands.Moderation.ActionUnSoftBanNoReason)
			});
		return (await moderationLog.create())!;
	}

	public async ban(rawOptions: ModerationActionOptions, days: number, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.Ban);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);
		await api()
			.guilds(this.guild.id)
			.bans(options.userId)
			.put({
				data: {
					delete_message_days: days
				},
				reason: await this.getReason('ban', moderationLog.reason)
			});

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.Ban);
		return (await moderationLog.create())!;
	}

	public async unBan(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnBan);
		const moderationLog = getModeration(this.guild).create(options);
		await api()
			.guilds(this.guild.id)
			.bans(options.userId)
			.delete({ reason: await this.getReason('ban', moderationLog.reason, true) });
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.Ban);
		return (await moderationLog.create())!;
	}

	public async voiceMute(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.VoiceMute);
		const moderationLog = getModeration(this.guild).create(options);
		await api()
			.guilds(this.guild.id)
			.members(options.userId)
			.patch({ data: { mute: true }, reason: await this.getReason('vmute', moderationLog.reason) });
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.VoiceMute);
		return (await moderationLog.create())!;
	}

	public async unVoiceMute(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnVoiceMute);
		const moderationLog = getModeration(this.guild).create(options);
		await api()
			.guilds(this.guild.id)
			.members(options.userId)
			.patch({ data: { mute: false }, reason: await this.getReason('vmute', moderationLog.reason, true) });
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.VoiceMute);
		return (await moderationLog.create())!;
	}

	public async voiceKick(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.VoiceKick);
		const moderationLog = getModeration(this.guild).create(options);
		await api()
			.guilds(this.guild.id)
			.members(options.userId)
			.patch({ data: { channel_id: null }, reason: await this.getReason('vkick', moderationLog.reason) });
		await this.sendDM(moderationLog, sendOptions);
		return (await moderationLog.create())!;
	}

	public async restrictAttachment(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedAttachment);
		await this.addRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedAttachment);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.RestrictionAttachment);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionAttachment);
		return (await moderationLog.create())!;
	}

	public async unRestrictAttachment(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.removeStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedAttachment);
		await this.removeRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedAttachment);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRestrictionAttachment);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionAttachment);
		return (await moderationLog.create())!;
	}

	public async restrictReaction(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedReaction);
		await this.addRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedReaction);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.RestrictionReaction);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionReaction);
		return (await moderationLog.create())!;
	}

	public async unRestrictReaction(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.removeStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedReaction);
		await this.removeRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedReaction);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRestrictionReaction);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionReaction);
		return (await moderationLog.create())!;
	}

	public async restrictEmbed(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedEmbed);
		await this.addRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedEmbed);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.RestrictionEmbed);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionEmbed);
		return (await moderationLog.create())!;
	}

	public async unRestrictEmbed(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.removeStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedEmbed);
		await this.removeRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedEmbed);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRestrictionEmbed);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionEmbed);
		return (await moderationLog.create())!;
	}

	public async restrictEmoji(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedEmoji);
		await this.addRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedEmoji);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.RestrictionEmoji);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionEmoji);
		return (await moderationLog.create())!;
	}

	public async unRestrictEmoji(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.removeStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedEmoji);
		await this.removeRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedEmoji);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRestrictionEmoji);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionEmoji);
		return (await moderationLog.create())!;
	}

	public async restrictVoice(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.addStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedVoice);
		await this.addRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedVoice);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.RestrictionVoice);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionVoice);
		return (await moderationLog.create())!;
	}

	public async unRestrictVoice(rawOptions: ModerationActionOptions, sendOptions?: ModerationActionsSendOptions) {
		await this.removeStickyRestriction(rawOptions.userId, GuildSettings.Roles.RestrictedVoice);
		await this.removeRestrictionRole(rawOptions.userId, GuildSettings.Roles.RestrictedVoice);
		const options = ModerationActions.fillOptions(rawOptions, TypeCodes.UnRestrictionVoice);
		const moderationLog = getModeration(this.guild).create(options);
		await this.sendDM(moderationLog, sendOptions);

		await this.cancelLastLogTaskFromUser(options.userId, TypeCodes.RestrictionVoice);
		return (await moderationLog.create())!;
	}

	public async muteSetup(message: Message) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[GuildSettings.Roles.Muted]]);
		if (roleId && this.guild.roles.cache.has(roleId)) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.ActionSetupMuteExists });
		if (this.guild.roles.cache.size >= 250) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.ActionSetupTooManyRoles });

		// Set up the shared role setup
		return this.sharedRoleSetup(message, RoleDataKey.Muted, GuildSettings.Roles.Muted);
	}

	public async restrictionSetup(message: Message, path: ModerationSetupRestriction) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[path]]);
		if (!isNullish(roleId) && this.guild.roles.cache.has(roleId)) {
			throw new UserError({ identifier: LanguageKeys.Commands.Moderation.ActionSetupRestrictionExists });
		}
		if (this.guild.roles.cache.size >= 250) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.ActionSetupTooManyRoles });

		// Set up the shared role setup
		return this.sharedRoleSetup(message, ModerationActions.getRoleDataKeyFromSchemaKey(path), path);
	}

	public async userIsBanned(user: User) {
		try {
			await api().guilds(this.guild.id).bans(user.id).get();
			return true;
		} catch (error) {
			if (!(error instanceof DiscordAPIError)) throw await resolveKey(this.guild, LanguageKeys.System.FetchBansFail);
			if (error.code === RESTJSONErrorCodes.UnknownBan) return false;
			throw error;
		}
	}

	public async userIsMuted(user: User) {
		const roleId = await readSettings(this.guild, GuildSettings.Roles.Muted);
		if (isNullish(roleId)) return false;
		return getStickyRoles(this.guild).has(user.id, roleId);
	}

	public async userIsVoiceMuted(user: User) {
		const member = await resolveOnErrorCodes(this.guild.members.fetch(user.id), RESTJSONErrorCodes.UnknownUser);
		return member?.voice.serverMute ?? false;
	}

	private async sharedRoleSetup(message: Message, key: RoleDataKey, path: PickByValue<GuildEntity, string | Nullish>) {
		const roleData = kRoleDataOptions.get(key)!;
		const role = await this.guild.roles.create({
			...roleData,
			reason: `[Role Setup] Authorized by ${message.author.username} (${message.author.id}).`
		});
		const t = await writeSettings(this.guild, (settings) => {
			Reflect.set(settings, path, role.id);
			return settings.getLanguage();
		});

		if (
			await promptConfirmation(
				message,
				t(LanguageKeys.Commands.Moderation.ActionSharedRoleSetupAsk, {
					role: role.name,
					channels: this.manageableChannelCount,
					permissions: this.displayPermissions(t, key).map((permission) => `\`${permission}\``)
				})
			)
		) {
			await this.updatePermissionsForCategoryChannels(role, key);
			await this.updatePermissionsForTextOrVoiceChannels(role, key);
		}
	}

	private displayPermissions(t: TFunction, key: RoleDataKey) {
		const options = kRoleChannelOverwriteOptions.get(key)!;
		const output: string[] = [];
		for (const keyOption of Object.keys(options.category.options)) {
			output.push(t(`permissions:${keyOption}`, keyOption));
		}
		return output;
	}

	private async fetchMe() {
		return this.guild.members.fetch(process.env.CLIENT_ID);
	}

	private async sendDM(entry: ModerationEntity, sendOptions: ModerationActionsSendOptions = {}) {
		if (sendOptions.send) {
			try {
				const target = await entry.fetchUser();
				const embed = await this.buildEmbed(entry, sendOptions);
				await resolveOnErrorCodes(target.send({ embeds: [embed] }), RESTJSONErrorCodes.CannotSendMessagesToThisUser);
			} catch (error) {
				container.logger.error(error);
			}
		}
	}

	private async buildEmbed(entry: ModerationEntity, sendOptions: ModerationActionsSendOptions) {
		const descriptionKey = entry.reason
			? entry.duration
				? LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithReasonWithDuration
				: LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithReason
			: entry.duration
			? LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithDuration
			: LanguageKeys.Commands.Moderation.ModerationDmDescription;

		const t = await fetchT(this.guild);
		const description = t(descriptionKey, {
			guild: this.guild.name,
			title: entry.title,
			reason: entry.reason,
			duration: entry.duration
		});
		const embed = new MessageEmbed() //
			.setDescription(description)
			.setFooter({ text: t(LanguageKeys.Commands.Moderation.ModerationDmFooter) });

		if (sendOptions.moderator) {
			embed.setAuthor({
				name: sendOptions.moderator.username,
				iconURL: sendOptions.moderator.displayAvatarURL({ size: 128, format: 'png', dynamic: true })
			});
		}

		return embed;
	}

	private async addStickyMute(id: string) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings.rolesMuted]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });
		return getStickyRoles(this.guild).add(id, roleId);
	}

	private async removeStickyMute(id: string) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings.rolesMuted]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });
		return getStickyRoles(this.guild).remove(id, roleId);
	}

	private async muteUser(rawOptions: ModerationActionOptions) {
		try {
			const member = await this.guild.members.fetch(rawOptions.userId);
			return this.muteUserInGuild(member, await this.getReason('mute', rawOptions.reason || null));
		} catch (error) {
			if ((error as DiscordAPIError).code === RESTJSONErrorCodes.UnknownMember)
				throw await resolveKey(this.guild, LanguageKeys.Commands.Moderation.ActionRequiredMember);
			throw error;
		}
	}

	private async muteUserInGuild(member: GuildMember, reason: string) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings.rolesMuted]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });

		const role = this.guild.roles.cache.get(roleId);
		if (typeof role === 'undefined') {
			await writeSettings(this.guild, [[GuildSettings.Roles.Muted, null]]);
			throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });
		}

		const { position } = (await this.fetchMe()).roles.highest;
		const extracted = ModerationActions.muteExtractRoles(member, position);
		extracted.keepRoles.push(roleId);

		await member.edit({ roles: extracted.keepRoles }, reason);
		return extracted.removedRoles;
	}

	private async unmuteUser(options: ModerationManagerCreateData & { reason: string | null }, moderationLog: ModerationEntity | null) {
		try {
			const member = await this.guild.members.fetch(options.userId);
			return moderationLog === null
				? this.unmuteUserInGuildWithoutData(member, await this.getReason('mute', options.reason, true))
				: this.unmuteUserInGuildWithData(member, await this.getReason('mute', options.reason, true), moderationLog);
		} catch (error) {
			if ((error as DiscordAPIError).code !== RESTJSONErrorCodes.UnknownMember) throw error;
		}
	}

	/**
	 * Unmute a user who is in a guild and has a running moderation log.
	 * @since 5.3.0
	 * @param member The member to unmute
	 * @param reason The reason to send for audit logs when unmuting
	 * @param moderationLog The moderation manager that defined the formal mute
	 */
	private async unmuteUserInGuildWithData(member: GuildMember, reason: string, moderationLog: ModerationEntity) {
		const roleId = await readSettings(this.guild, GuildSettings.Roles.Muted);
		const { position } = (await this.fetchMe()).roles.highest;
		const rawRoleIds = Array.isArray(moderationLog.extraData) ? (moderationLog.extraData as string[]) : [];
		const roles = this.unmuteExtractRoles(member, roleId, position, rawRoleIds);
		await member.edit({ roles }, reason);

		return roles;
	}

	/**
	 * Unmute a user who is in a guild and does not have a running moderation log, e.g. when unmuting somebody who
	 * merely has the muted role.
	 * @since 5.3.0
	 * @param member The member to unmute
	 * @param reason The reason to send for audit logs when unmuting
	 */
	private async unmuteUserInGuildWithoutData(member: GuildMember, reason: string) {
		// Retrieve the role ID of the mute role, return false if it does not exist.
		const [roleId] = await readSettings(this.guild, (settings) => [settings.rolesMuted]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });

		// Retrieve the role instance from the role ID, reset and return false if it does not exist.
		const role = this.guild.roles.cache.get(roleId);
		if (typeof role === 'undefined') {
			await writeSettings(this.guild, [[GuildSettings.Roles.Muted, null]]);
			throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });
		}

		// If the user has the role, begin processing the data.
		if (member.roles.cache.has(roleId)) {
			// Fetch self and check if the bot has enough role hierarchy to manage the role, return false when not.
			const { position } = (await this.fetchMe()).roles.highest;
			if (role.position >= position) throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteLowHierarchy });

			// Remove the role from the member.
			await member.roles.remove(roleId, reason);
			return;
		}

		throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotInMember });
	}

	private unmuteExtractRoles(member: GuildMember, roleId: string | Nullish, selfPosition: number, rawIdentifiers: readonly string[] | null) {
		if (rawIdentifiers === null) rawIdentifiers = [];

		const rawRoles: Role[] = [];
		for (const id of rawIdentifiers) {
			const role = this.guild.roles.cache.get(id);
			if (typeof role !== 'undefined') rawRoles.push(role);
		}

		const roles = new Set<string>(member.roles.cache.keys());
		for (const rawRole of rawRoles) {
			if (rawRole.position < selfPosition) roles.add(rawRole.id);
		}

		if (!isNullish(roleId)) roles.delete(roleId);

		return [...roles];
	}

	private async addStickyRestriction(id: string, key: PickByValue<GuildEntity, string | Nullish>) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[key]]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Misc.RestrictionNotConfigured });
		return getStickyRoles(this.guild).add(id, roleId);
	}

	private async addRestrictionRole(id: string, key: PickByValue<GuildEntity, string | Nullish>) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[key]]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Misc.RestrictionNotConfigured });
		await api().guilds(this.guild.id).members(id).roles(roleId).put();
	}

	private async removeStickyRestriction(id: string, key: PickByValue<GuildEntity, string | Nullish>) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[key]]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Misc.RestrictionNotConfigured });
		return getStickyRoles(this.guild).remove(id, roleId);
	}

	private async removeRestrictionRole(id: string, key: PickByValue<GuildEntity, string | Nullish>) {
		const [roleId] = await readSettings(this.guild, (settings) => [settings[key]]);
		if (isNullish(roleId)) throw new UserError({ identifier: LanguageKeys.Misc.RestrictionNotConfigured });
		try {
			await api().guilds(this.guild.id).members(id).roles(roleId).delete();
		} catch (error) {
			if ((error as DiscordAPIError).code !== RESTJSONErrorCodes.UnknownMember) throw error;
		}
	}

	private async updatePermissionsForCategoryChannels(role: Role, dataKey: RoleDataKey) {
		const options = kRoleChannelOverwriteOptions.get(dataKey)!;
		const promises: Promise<unknown>[] = [];
		for (const channel of this.guild.channels.cache.values()) {
			if (isCategoryChannel(channel) && channel.manageable) {
				promises.push(ModerationActions.updatePermissionsForChannel(role, channel, options.category));
			}
		}

		await Promise.all(promises);
	}

	private async updatePermissionsForTextOrVoiceChannels(role: Role, dataKey: RoleDataKey) {
		const options = kRoleChannelOverwriteOptions.get(dataKey)!;
		const promises: Promise<unknown>[] = [];
		for (const channel of this.guild.channels.cache.values()) {
			if (!channel.manageable) continue;
			if (isTextChannel(channel) || isNewsChannel(channel)) {
				promises.push(ModerationActions.updatePermissionsForChannel(role, channel, options.text));
			} else if (isVoiceChannel(channel) || isStageChannel(channel)) {
				promises.push(ModerationActions.updatePermissionsForChannel(role, channel, options.voice));
			}
		}

		await Promise.all(promises);
	}

	/**
	 * Deletes the task from the last log from a user's cases
	 * @param userId The user ID to use when fetching
	 * @param type The type to retrieve for the invalidation
	 */
	private async cancelLastLogTaskFromUser(userId: string, type: TypeCodes, extra?: (log: ModerationEntity) => boolean) {
		const log = await this.retrieveLastLogFromUser(userId, type, extra);
		if (!log) return null;

		const { task } = log;
		if (task && !task.running) await task.delete();
		return log;
	}

	private async getReason(action: keyof ModerationAction, reason: string | null, revoke = false) {
		const t = await fetchT(this.guild);
		const actions = t(LanguageKeys.Commands.Moderation.Actions);
		if (!reason)
			return revoke
				? t(LanguageKeys.Commands.Moderation.ActionRevokeNoReason, { action: actions[action] })
				: t(LanguageKeys.Commands.Moderation.ActionApplyNoReason, { action: actions[action] });
		return revoke
			? t(LanguageKeys.Commands.Moderation.ActionRevokeReason, { action: actions[action], reason })
			: t(LanguageKeys.Commands.Moderation.ActionApplyReason, { action: actions[action], reason });
	}

	private async retrieveLastLogFromUser(userId: string, type: TypeCodes, extra: (log: ModerationEntity) => boolean = () => true) {
		// Retrieve all moderation logs regarding a user.
		const logs = await getModeration(this.guild).fetch(userId);

		// Filter all logs by valid and by type of mute (isType will include temporary and invisible).
		return logs.filter((log) => !log.invalidated && log.isType(type) && extra(log)).last();
	}

	private static getRoleDataKeyFromSchemaKey(key: ModerationSetupRestriction): RoleDataKey {
		switch (key) {
			case ModerationSetupRestriction.All:
				return RoleDataKey.Muted;
			case ModerationSetupRestriction.Attachment:
				return RoleDataKey.Attachment;
			case ModerationSetupRestriction.Embed:
				return RoleDataKey.Embed;
			case ModerationSetupRestriction.Emoji:
				return RoleDataKey.Emoji;
			case ModerationSetupRestriction.Reaction:
				return RoleDataKey.Reaction;
			case ModerationSetupRestriction.Voice:
				return RoleDataKey.Voice;
		}
	}

	private static fillOptions(rawOptions: ModerationActionOptions, type: TypeCodes) {
		const options = { reason: null, ...rawOptions, type };
		if (isNullishOrEmpty(options.reason)) options.reason = null;
		if (isNullishOrEmpty(options.moderatorId)) options.moderatorId = process.env.CLIENT_ID;
		if (isNullishOrZero(options.duration)) options.duration = null;
		return options;
	}

	private static muteExtractRoles(member: GuildMember, selfPosition: number) {
		const keepRoles: string[] = [];
		const removedRoles: string[] = [];

		// Iterate over all the member's roles.
		for (const [id, role] of member.roles.cache.entries()) {
			// Managed roles cannot be removed.
			if (role.managed) keepRoles.push(id);
			// Roles with higher hierarchy position cannot be removed.
			else if (role.position >= selfPosition) keepRoles.push(id);
			// Else it is fine to remove the role.
			else removedRoles.push(id);
		}

		return { keepRoles, removedRoles };
	}

	private static async updatePermissionsForChannel(role: Role, channel: GuildChannel, rolePermissions: RolePermissionOverwriteOptionField | null) {
		if (rolePermissions === null) return;

		const current = channel.permissionOverwrites.cache.get(role.id);
		if (typeof current === 'undefined') {
			// If no permissions overwrites exists, create a new one.
			await channel.permissionOverwrites.edit(role, rolePermissions.options, { reason: '[Setup] Updated channel for Muted Role.' });
		} else if (!current.deny.has(rolePermissions.permissions)) {
			// If one exists and does not have the deny fields, tweak the existing one to keep all the allowed and
			// denied, but also add the ones that must be denied for the mute role to work.
			const allowed = current.allow.toArray().map((permission) => [permission, true]);
			const denied = current.allow.toArray().map((permission) => [permission, false]);
			const mixed = Object.fromEntries(allowed.concat(denied));
			await current.edit({ ...mixed, ...rolePermissions.options });
		}
	}
}

export interface ModerationActionsSendOptions {
	send?: boolean;
	moderator?: User | null;
}

interface RolePermissionOverwriteOption {
	category: RolePermissionOverwriteOptionField;
	text: RolePermissionOverwriteOptionField | null;
	voice: RolePermissionOverwriteOptionField | null;
}

interface RolePermissionOverwriteOptionField {
	options: PermissionOverwriteOptions;
	permissions: Permissions;
}

export type ModerationActionOptions = Omit<ModerationManagerCreateData, 'type'>;
