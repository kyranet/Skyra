import type {
	CustomCommand, DisabledCommandChannel,
	NotificationsStreamTwitch, PermissionsNode,
	RolesAuto, RolesReaction, StickyRole,
	TriggerAlias, TriggerIncludes, UniqueRoleSet
} from '@lib/types/settings/GuildSettings';
import { PREFIX } from '@root/config';
import { BaseEntity, Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('guilds', { schema: 'public' })
@Check(/* sql */`"prefix"::text <> ''::text`)
@Check(/* sql */`("selfmod.attachmentMaximum" >= 0) AND ("selfmod.attachmentMaximum" <= 60)`)
@Check(/* sql */`("selfmod.attachmentDuration" >= 5000) AND ("selfmod.attachmentDuration" <= 120000)`)
@Check(/* sql */`"selfmod.attachmentPunishmentDuration" >= 1000`)

@Check(/* sql */`("selfmod.capitals.maximum" >= 10) AND ("selfmod.capitals.maximum" <= 100)`)
@Check(/* sql */`"selfmod.capitals.hardActionDuration" >= 1000`)
@Check(/* sql */`("selfmod.capitals.thresholdMaximum" >= 0) AND ("selfmod.capitals.thresholdMaximum" <= 60)`)
@Check(/* sql */`("selfmod.capitals.thresholdDuration" >= 0) AND ("selfmod.capitals.thresholdDuration" <= 120000)`)

@Check(/* sql */`("selfmod.newlines.maximum" >= 10) AND ("selfmod.newlines.maximum" <= 2000)`)
@Check(/* sql */`"selfmod.newlines.hardActionDuration" >= 1000`)
@Check(/* sql */`("selfmod.newlines.thresholdMaximum" >= 0) AND ("selfmod.newlines.thresholdMaximum" <= 60)`)
@Check(/* sql */`("selfmod.newlines.thresholdDuration" >= 0) AND ("selfmod.newlines.thresholdDuration" <= 120000)`)

@Check(/* sql */`"selfmod.invites.hardActionDuration" >= 1000`)
@Check(/* sql */`("selfmod.invites.thresholdMaximum" >= 0) AND ("selfmod.invites.thresholdMaximum" <= 60)`)
@Check(/* sql */`("selfmod.invites.thresholdDuration" >= 0) AND ("selfmod.invites.thresholdDuration" <= 120000)`)

@Check(/* sql */`"selfmod.filter.hardActionDuration" >= 1000`)
@Check(/* sql */`("selfmod.filter.thresholdMaximum" >= 0) AND ("selfmod.filter.thresholdMaximum" <= 60)`)
@Check(/* sql */`("selfmod.filter.thresholdDuration" >= 0) AND ("selfmod.filter.thresholdDuration" <= 120000)`)

@Check(/* sql */`("selfmod.raidthreshold" >= 2) AND ("selfmod.raidthreshold" <= 50)`)

@Check(/* sql */`"no-mention-spam.mentionsAllowed" >= 0`)
@Check(/* sql */`"no-mention-spam.timePeriod" >= 0`)

@Check(/* sql */`"starboard.minimum" >= 1`)
export class GuildEntity extends BaseEntity {

	@PrimaryColumn('varchar', { name: 'id', length: 19 })
	public id!: string;

	@Column('varchar', { 'name': 'prefix', 'length': 10, 'default': PREFIX })
	public prefix = PREFIX;

	@Column('varchar', { 'name': 'language', 'length': 5, 'default': 'en-US' })
	public language = 'en-US';

	@Column('boolean', { 'name': 'disableNaturalPrefix', 'default': false })
	public disableNaturalPrefix = false;

	@Column('varchar', { 'name': 'disabledCommands', 'length': 32, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public disabledCommands: string[] = [];

	@Column('integer', { 'name': 'commandUses', 'default': 0 })
	public commandUses = 0;

	@Column('simple-json', { 'name': 'custom-commands', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public customCommands: CustomCommand[] = [];

	@Column('simple-json', { 'name': 'permissions.users', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public permissionsUsers: PermissionsNode[] = [];

	@Column('simple-json', { 'name': 'permissions.roles', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public permissionsRoles: PermissionsNode[] = [];

	@Column('varchar', { name: 'channels.announcements', nullable: true, length: 19 })
	public channelsAnnouncements?: string | null;

	@Column('varchar', { name: 'channels.greeting', nullable: true, length: 19 })
	public channelsGreeting?: string | null;

	@Column('varchar', { name: 'channels.farewell', nullable: true, length: 19 })
	public channelsFarewell?: string | null;

	@Column('varchar', { name: 'channels.member-logs', nullable: true, length: 19 })
	public channelsMemberLogs?: string | null;

	@Column('varchar', { name: 'channels.message-logs', nullable: true, length: 19 })
	public channelsMessageLogs?: string | null;

	@Column('varchar', { name: 'channels.moderation-logs', nullable: true, length: 19 })
	public channelsModerationLogs?: string | null;

	@Column('varchar', { name: 'channels.nsfw-message-logs', nullable: true, length: 19 })
	public channelsNsfwMessageLogs?: string | null;

	@Column('varchar', { name: 'channels.image-logs', nullable: true, length: 19 })
	public channelsImageLogs?: string | null;

	@Column('varchar', { name: 'channels.prune-logs', nullable: true, length: 19 })
	public channelsPruneLogs?: string | null;

	@Column('varchar', { name: 'channels.reaction-logs', nullable: true, length: 19 })
	public channelsReactionLogs?: string | null;

	@Column('varchar', { name: 'channels.roles', nullable: true, length: 19 })
	public channelsRoles?: string | null;

	@Column('varchar', { name: 'channels.spam', nullable: true, length: 19 })
	public channelsSpam?: string | null;

	@Column('varchar', { 'name': 'channels.ignore.all', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public channelsIgnoreAll: string[] = [];

	@Column('varchar', { 'name': 'channels.ignore.message-edit', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public channelsIgnoreMessageEdits: string[] = [];

	@Column('varchar', { 'name': 'channels.ignore.message-delete', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public channelsIgnoreMessageDeletes: string[] = [];

	@Column('varchar', { 'name': 'channels.ignore.reaction-add', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public channelsIgnoreReactionAdds: string[] = [];

	@Column('simple-json', { 'name': 'command-autodelete', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public commandAutodelete: [string, number][] = [];

	@Column('varchar', { 'name': 'disabledChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public disabledChannels: string[] = [];

	@Column('simple-json', { 'name': 'disabledCommandsChannels', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public disabledCommandsChannels: DisabledCommandChannel[] = [];

	@Column('boolean', { 'name': 'events.banAdd', 'default': false })
	public eventsBanAdd = false;

	@Column('boolean', { 'name': 'events.banRemove', 'default': false })
	public eventsBanRemove = false;

	@Column('boolean', { 'name': 'events.memberAdd', 'default': false })
	public eventsMemberAdd = false;

	@Column('boolean', { 'name': 'events.memberRemove', 'default': false })
	public eventsMemberRemove = false;

	@Column('boolean', { 'name': 'events.memberNameUpdate', 'default': false })
	public eventsMemberNameUpdate = false;

	@Column('boolean', { 'name': 'events.memberRoleUpdate', 'default': false })
	public eventsMemberRoleUpdate = false;

	@Column('boolean', { 'name': 'events.messageDelete', 'default': false })
	public eventsMessageDelete = false;

	@Column('boolean', { 'name': 'events.messageEdit', 'default': false })
	public eventsMessageEdit = false;

	@Column('boolean', { 'name': 'events.twemoji-reactions', 'default': false })
	public eventsTwemojiReactions = false;

	@Column('varchar', { name: 'messages.farewell', nullable: true, length: 2000 })
	public messagesFarewell?: string | null;

	@Column('varchar', { name: 'messages.greeting', nullable: true, length: 2000 })
	public messagesGreeting?: string | null;

	@Column('varchar', { name: 'messages.join-dm', nullable: true, length: 1500 })
	public messagesJoinDM?: string | null;

	@Column('varchar', { 'name': 'messages.ignoreChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public messagesIgnoreChannels: string[] = [];

	@Column('boolean', { 'name': 'messages.announcement-embed', 'default': false })
	public messagesAnnouncementEmbed = false;

	@Column('boolean', { 'name': 'messages.moderation-dm', 'default': false })
	public messagesModerationDm = false;

	@Column('boolean', { 'name': 'messages.moderation-reason-display', 'default': true })
	public messagesModerationReasonDisplay = true;

	@Column('boolean', { 'name': 'messages.moderation-message-display', 'default': true })
	public messagesModerationMessageDisplay = true;

	@Column('boolean', { 'name': 'messages.moderation-auto-delete', 'default': false })
	public messagesModerationAutoDelete = false;

	@Column('boolean', { 'name': 'messages.moderator-name-display', 'default': true })
	public messagesModeratorNameDisplay = true;

	@Column('simple-json', { 'name': 'stickyRoles', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public stickyRoles: StickyRole[] = [];

	@Column('varchar', { name: 'roles.admin', nullable: true, length: 19 })
	public rolesAdmin?: string | null;

	@Column('simple-json', { 'name': 'roles.auto', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public rolesAuto: RolesAuto[] = [];

	@Column('varchar', { name: 'roles.initial', nullable: true, length: 19 })
	public rolesInitial?: string | null;

	@Column('varchar', { name: 'roles.messageReaction', nullable: true, length: 19 })
	public rolesMessageReaction?: string | null;

	@Column('varchar', { name: 'roles.moderator', nullable: true, length: 19 })
	public rolesModerator?: string | null;

	@Column('varchar', { name: 'roles.muted', nullable: true, length: 19 })
	public rolesMuted?: string | null;

	@Column('varchar', { name: 'roles.restricted-reaction', nullable: true, length: 19 })
	public rolesRestrictedReaction?: string | null;

	@Column('varchar', { name: 'roles.restricted-embed', nullable: true, length: 19 })
	public rolesRestrictedEmbed?: string | null;

	@Column('varchar', { name: 'roles.restricted-emoji', nullable: true, length: 19 })
	public rolesRestrictedEmoji?: string | null;

	@Column('varchar', { name: 'roles.restricted-attachment', nullable: true, length: 19 })
	public rolesRestrictedAttachment?: string | null;

	@Column('varchar', { name: 'roles.restricted-voice', nullable: true, length: 19 })
	public rolesRestrictedVoice?: string | null;

	@Column('varchar', { 'name': 'roles.public', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public rolesPublic: string[] = [];

	@Column('simple-json', { 'name': 'roles.reactions', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public rolesReactions: RolesReaction[] = [];

	@Column('boolean', { 'name': 'roles.removeInitial', 'default': false })
	public rolesRemoveInitial = false;

	@Column('varchar', { name: 'roles.dj', nullable: true, length: 19 })
	public rolesDj?: string | null;

	@Column('varchar', { name: 'roles.subscriber', nullable: true, length: 19 })
	public rolesSubscriber?: string | null;

	@Column('simple-json', { 'name': 'roles.uniqueRoleSets', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public rolesUniqueRoleSets: UniqueRoleSet[] = [];

	@Column('boolean', { 'name': 'selfmod.attachment', 'default': false })
	public selfmodAttachment = false;

	@Column('smallint', { 'name': 'selfmod.attachmentMaximum', 'default': 20 })
	public selfmodAttachmentMaximum = 20;

	@Column('smallint', { 'name': 'selfmod.attachmentDuration', 'default': 20000 })
	public selfmodAttachmentDuration = 20000;

	@Column('smallint', { 'name': 'selfmod.attachmentAction', 'default': 0 })
	public selfmodAttachmentAction = 0;

	@Column('integer', { name: 'selfmod.attachmentPunishmentDuration', nullable: true })
	public selfmodAttachmentPunishmentDuration?: number | null;

	@Column('boolean', { 'name': 'selfmod.capitals.enabled', 'default': false })
	public selfmodCapitalsEnabled = false;

	@Column('varchar', { 'name': 'selfmod.capitals.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodCapitalsIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.capitals.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodCapitalsIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.capitals.minimum', 'default': 15 })
	public selfmodCapitalsMinimum = 15;

	@Column('smallint', { 'name': 'selfmod.capitals.maximum', 'default': 50 })
	public selfmodCapitalsMaximum = 50;

	@Column('smallint', { 'name': 'selfmod.capitals.softAction', 'default': 0 })
	public selfmodCapitalsSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.capitals.hardAction', 'default': 0 })
	public selfmodCapitalsHardAction = 0;

	@Column('integer', { name: 'selfmod.capitals.hardActionDuration', nullable: true })
	public selfmodCapitalsHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.capitals.thresholdMaximum', 'default': 10 })
	public selfmodCapitalsThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.capitals.thresholdDuration', 'default': 60000 })
	public selfmodCapitalsThresholdDuration = 60000;

	@Column('varchar', { 'name': 'selfmod.links.whitelist', 'length': 128, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodLinksWhitelist: string[] = [];

	@Column('boolean', { 'name': 'selfmod.links.enabled', 'default': false })
	public selfmodLinksEnabled = false;

	@Column('varchar', { 'name': 'selfmod.links.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodLinksIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.links.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodLinksIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.links.softAction', 'default': 0 })
	public selfmodLinksSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.links.hardAction', 'default': 0 })
	public selfmodLinksHardAction = 0;

	@Column('integer', { name: 'selfmod.links.hardActionDuration', nullable: true })
	public selfmodLinksHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.links.thresholdMaximum', 'default': 10 })
	public selfmodLinksThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.links.thresholdDuration', 'default': 60000 })
	public selfmodLinksThresholdDuration = 60000;

	@Column('boolean', { 'name': 'selfmod.messages.enabled', 'default': false })
	public selfmodMessagesEnabled = false;

	@Column('varchar', { 'name': 'selfmod.messages.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodMessagesIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.messages.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodMessagesIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.messages.maximum', 'default': 5 })
	public selfmodMessagesMaximum = 5;

	@Column('smallint', { 'name': 'selfmod.messages.queue-size', 'default': 50 })
	public selfmodMessagesQueueSize = 50;

	@Column('smallint', { 'name': 'selfmod.messages.softAction', 'default': 0 })
	public selfmodMessagesSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.messages.hardAction', 'default': 0 })
	public selfmodMessagesHardAction = 0;

	@Column('integer', { name: 'selfmod.messages.hardActionDuration', nullable: true })
	public selfmodMessagesHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.messages.thresholdMaximum', 'default': 10 })
	public selfmodMessagesThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.messages.thresholdDuration', 'default': 60000 })
	public selfmodMessagesThresholdDuration = 60000;

	@Column('boolean', { 'name': 'selfmod.newlines.enabled', 'default': false })
	public selfmodNewlinesEnabled = false;

	@Column('varchar', { 'name': 'selfmod.newlines.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodNewlinesIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.newlines.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodNewlinesIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.newlines.maximum', 'default': 10 })
	public selfmodNewlinesMaximum = 10;

	@Column('smallint', { 'name': 'selfmod.newlines.softAction', 'default': 0 })
	public selfmodNewlinesSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.newlines.hardAction', 'default': 0 })
	public selfmodNewlinesHardAction = 0;

	@Column('integer', { name: 'selfmod.newlines.hardActionDuration', nullable: true })
	public selfmodNewlinesHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.newlines.thresholdMaximum', 'default': 10 })
	public selfmodNewlinesThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.newlines.thresholdDuration', 'default': 60000 })
	public selfmodNewlinesThresholdDuration = 60000;

	@Column('boolean', { 'name': 'selfmod.invites.enabled', 'default': false })
	public selfmodInvitesEnabled = false;

	@Column('varchar', { 'name': 'selfmod.invites.ignoredCodes', 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodInvitesIgnoredCodes: string[] = [];

	@Column('varchar', { 'name': 'selfmod.invites.ignoredGuilds', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodInvitesIgnoredGuilds: string[] = [];

	@Column('varchar', { 'name': 'selfmod.invites.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodInvitesIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.invites.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodInvitesIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.invites.softAction', 'default': 0 })
	public selfmodInvitesSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.invites.hardAction', 'default': 0 })
	public selfmodInvitesHardAction = 0;

	@Column('integer', { name: 'selfmod.invites.hardActionDuration', nullable: true })
	public selfmodInvitesHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.invites.thresholdMaximum', 'default': 10 })
	public selfmodInvitesThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.invites.thresholdDuration', 'default': 60000 })
	public selfmodInvitesThresholdDuration = 60000;

	@Column('boolean', { 'name': 'selfmod.filter.enabled', 'default': false })
	public selfmodFilterEnabled = false;

	@Column('varchar', { 'name': 'selfmod.filter.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodFilterIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.filter.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodFilterIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.filter.softAction', 'default': 0 })
	public selfmodFilterSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.filter.hardAction', 'default': 0 })
	public selfmodFilterHardAction = 0;

	@Column('integer', { name: 'selfmod.filter.hardActionDuration', nullable: true })
	public selfmodFilterHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.filter.thresholdMaximum', 'default': 10 })
	public selfmodFilterThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.filter.thresholdDuration', 'default': 60000 })
	public selfmodFilterThresholdDuration = 60000;

	@Column('varchar', { 'name': 'selfmod.filter.raw', 'length': 32, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodFilterRaw: string[] = [];

	@Column('boolean', { 'name': 'selfmod.reactions.enabled', 'default': false })
	public selfmodReactionsEnabled = false;

	@Column('varchar', { 'name': 'selfmod.reactions.ignoredRoles', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodReactionsIgnoredRoles: string[] = [];

	@Column('varchar', { 'name': 'selfmod.reactions.ignoredChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodReactionsIgnoredChannels: string[] = [];

	@Column('smallint', { 'name': 'selfmod.reactions.maximum', 'default': 10 })
	public selfmodReactionsMaximum = 10;

	@Column('varchar', { 'name': 'selfmod.reactions.whitelist', 'length': 128, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodReactionsWhitelist: string[] = [];

	@Column('varchar', { 'name': 'selfmod.reactions.blacklist', 'length': 128, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodReactionsBlacklist: string[] = [];

	@Column('smallint', { 'name': 'selfmod.reactions.softAction', 'default': 0 })
	public selfmodReactionsSoftAction = 0;

	@Column('smallint', { 'name': 'selfmod.reactions.hardAction', 'default': 0 })
	public selfmodReactionsHardAction = 0;

	@Column('integer', { name: 'selfmod.reactions.hardActionDuration', nullable: true })
	public selfmodReactionsHardActionDuration?: number | null;

	@Column('smallint', { 'name': 'selfmod.reactions.thresholdMaximum', 'default': 10 })
	public selfmodReactionsThresholdMaximum = 10;

	@Column('integer', { 'name': 'selfmod.reactions.thresholdDuration', 'default': 60000 })
	public selfmodReactionsThresholdDuration = 60000;

	@Column('boolean', { 'name': 'selfmod.raid', 'default': false })
	public selfmodRaid = false;

	@Column('smallint', { 'name': 'selfmod.raidthreshold', 'default': 10 })
	public selfmodRaidthreshold = 10;

	@Column('varchar', { 'name': 'selfmod.ignoreChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public selfmodIgnoreChannels: string[] = [];

	@Column('boolean', { 'name': 'no-mention-spam.enabled', 'default': false })
	public noMentionSpamEnabled = false;

	@Column('boolean', { 'name': 'no-mention-spam.alerts', 'default': false })
	public noMentionSpamAlerts = false;

	@Column('smallint', { 'name': 'no-mention-spam.mentionsAllowed', 'default': 20 })
	public noMentionSpamMentionsAllowed = 20;

	@Column('integer', { 'name': 'no-mention-spam.timePeriod', 'default': 8 })
	public noMentionSpamTimePeriod = 8;

	@Column('boolean', { 'name': 'social.enabled', 'default': true })
	public socialEnabled = true;

	@Column('boolean', { 'name': 'social.achieve', 'default': false })
	public socialAchieve = false;

	@Column('varchar', { name: 'social.achieveMessage', nullable: true, length: 2000 })
	public socialAchieveMessage?: string | null;

	@Column('numeric', { 'name': 'social.multiplier', 'precision': 53, 'default': 1 })
	public socialMultiplier = 1;

	@Column('varchar', { 'name': 'social.ignoreChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public socialIgnoreChannels: string[] = [];

	@Column('varchar', { name: 'starboard.channel', nullable: true, length: 19 })
	public starboardChannel?: string | null;

	@Column('varchar', { 'name': 'starboard.emoji', 'length': 75, 'default': '%E2%AD%90' })
	public starboardEmoji = '%E2%AD%90';

	@Column('varchar', { 'name': 'starboard.ignoreChannels', 'length': 19, 'array': true, 'default': () => 'ARRAY[]::VARCHAR[]' })
	public starboardIgnoreChannels: string[] = [];

	@Column('smallint', { 'name': 'starboard.minimum', 'default': 1 })
	public starboardMinimum = 1;

	@Column('simple-json', { 'name': 'trigger.alias', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public triggerAlias: TriggerAlias[] = [];

	@Column('simple-json', { 'name': 'trigger.includes', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public triggerIncludes: TriggerIncludes[] = [];

	@Column('smallint', { 'name': 'music.default-volume', 'default': 100 })
	public musicDefaultVolume = 100;

	@Column('integer', { 'name': 'music.maximum-duration', 'default': 7200000 })
	public musicMaximumDuration = 7200000;

	@Column('smallint', { 'name': 'music.maximum-entries-per-user', 'default': 100 })
	public musicMaximumEntriesPerUser = 100;

	@Column('boolean', { 'name': 'music.allow-streams', 'default': true })
	public musicAllowStreams = true;

	@Column('simple-json', { 'name': 'notifications.streams.twitch.streamers', 'array': true, 'default': () => 'ARRAY[]::JSON[]' })
	public notificationsStreamsTwitchStreamers: NotificationsStreamTwitch[] = [];

	@Column('varchar', { 'name': 'suggestions.emojis.upvote', 'length': 128, 'default': ':ArrowT:694594285487652954' })
	public suggestionsEmojisUpvote = ':ArrowT:694594285487652954';

	@Column('integer', { 'name': 'suggestions.id', 'default': 1 })
	public suggestionsId = 1;

	@Column('varchar', { 'name': 'suggestions.emojis.downvote', 'length': 128, 'default': ':ArrowB:694594285269680179' })
	public suggestionsEmojisDownvote = ':ArrowB:694594285269680179';

	@Column('varchar', { name: 'suggestions.channel', nullable: true, length: 19 })
	public suggestionsChannel?: string | null;

	@Column('boolean', { 'name': 'suggestions.on-action.dm', 'default': false })
	public suggestionsOnActionDm = false;

	@Column('boolean', { 'name': 'suggestions.on-action.repost', 'default': false })
	public suggestionsOnActionRepost = false;

	@Column('boolean', { 'name': 'suggestions.on-action.hide-author', 'default': false })
	public suggestionsOnActionHideAuthor = false;

}
