import { Snowflake } from "discord.js";

/* eslint-disable @typescript-eslint/no-namespace */

export namespace GuildSettings {

	export type Prefix = string;
	export const Prefix = 'prefix';
	export type Tags = readonly [string, string][];
	export const Tags = 'tags';

	export namespace Channels {
		export type Announcements = string;
		export const Announcements = 'channels.announcements';
		export type Greeting = string;
		export const Greeting = 'channels.greeting';
		export type Farewell = string;
		export const Farewell = 'channels.farewell';
		export type MemberLogs = string;
		export const MemberLogs = 'channels.member-logs';
		export type MessageLogs = string;
		export const MessageLogs = 'channels.message-logs';
		export type ModerationLogs = string;
		export const ModerationLogs = 'channels.moderation-logs';
		export type NSFWMessageLogs = string;
		export const NSFWMessageLogs = 'channels.nsfw-message-logs';
		export type Roles = string;
		export const Roles = 'channels.roles';
		export type Spam = string;
		export const Spam = 'channels.spam';
	}

	export type DisabledChannels = readonly string[];
	export const DisabledChannels = 'disabledChannels';
	export type DisabledCommandChannels = readonly DisabledCommandChannel[];
	export const DisabledCommandChannels = 'disabledCommandsChannels';

	export namespace Events {
		export type BanAdd = boolean;
		export const BanAdd = 'events.banAdd';
		export type BanRemove = boolean;
		export const BanRemove = 'events.banRemove';
		export type MemberAdd = boolean;
		export const MemberAdd = 'events.memberAdd';
		export type MemberRemove = boolean;
		export const MemberRemove = 'events.memberRemove';
		export type MessageDelete = boolean;
		export const MessageDelete = 'events.messageDelete';
		export type MessageEdit = boolean;
		export const MessageEdit = 'events.messageEdit';
	}

	export namespace Filter {
		export type Level = number;
		export const Level = 'filter.level';
		export type Raw = readonly string[];
		export const Raw = 'filter.raw';
	}

	export namespace Messages {
		export type Farewell = string;
		export const Farewell = 'messages.farewell';
		export type Greeting = string;
		export const Greeting = 'messages.greeting';
		export type JoinDM = string;
		export const JoinDM = 'messages.join-dm';
		export type Warnings = boolean;
		export const Warnings = 'messages.warnings';
		export type IgnoreChannels = readonly string[];
		export const IgnoreChannels = 'messages.ignoreChannels';
	}

	export type StickyRoles = readonly StickyRole[];
	export const StickyRoles = 'stickyRoles';

	export namespace Roles {
		export type Admin = string;
		export const Admin = 'roles.admin';
		export type Auto = readonly RolesAuto[];
		export const Auto = 'roles.auto';
		export type Initial = string;
		export const Initial = 'roles.initial';
		export type MessageReaction = string;
		export const MessageReaction = 'roles.messageReaction';
		export type Moderator = string;
		export const Moderator = 'roles.moderator';
		export type Muted = string;
		export const Muted = 'roles.muted';
		export type Public = string[];
		export const Public = 'roles.public';
		export type Reactions = readonly RolesReaction[];
		export const Reactions = 'roles.reactions';
		export type RemoveInitial = boolean;
		export const RemoveInitial = 'roles.removeInitial';
		export type Staff = string;
		export const Staff = 'roles.staff';
		export type Subscriber = string;
		export const Subscriber = 'roles.subscriber';
		export type UniqueRoleSets = readonly UniqueRoleSet[];
		export const UniqueRoleSets = 'roles.uniqueRoleSets';
	}

	export namespace Selfmod {
		export type Attachment = boolean;
		export const Attachment = 'selfmod.attachment';
		export type AttachmentAction = number;
		export const AttachmentAction = 'selfmod.attachmentAction';
		export type AttachmentDuration = number;
		export const AttachmentDuration = 'selfmod.attachmentDuration';
		export type AttachmentMaximum = number;
		export const AttachmentMaximum = 'selfmod.attachmentMaximum';
		export type AttachmentPunishmentDuration = number;
		export const AttachmentPunishmentDuration = 'selfmod.attachmentPunishmentDuration';
		export type Capsfilter = number;
		export const Capsfilter = 'selfmod.capsfilter';
		export type Capsminimum = number;
		export const Capsminimum = 'selfmod.capsminimum';
		export type Capsthreshold = number;
		export const Capsthreshold = 'selfmod.capsthreshold';
		export type IgnoreChannels = readonly string[];
		export const IgnoreChannels = 'selfmod.ignoreChannels';
		export type Invitelinks = boolean;
		export const Invitelinks = 'selfmod.invitelinks';
		export type Raid = string;
		export const Raid = 'selfmod.raid';
		export type Raidthreshold = number;
		export const Raidthreshold = 'selfmod.raidthreshold';
	}

	export namespace NoMentionSpam {
		export type Alerts = boolean;
		export const Alerts = 'no-mention-spam.alerts';
		export type Enabled = boolean;
		export const Enabled = 'no-mention-spam.enabled';
		export type MentionsAllowed = number;
		export const MentionsAllowed = 'no-mention-spam.mentionsAllowed';
		export type TimePeriod = number;
		export const TimePeriod = 'no-mention-spam.timePeriod';
	}

	export namespace Social {
		export type Achieve = boolean;
		export const Achieve = 'social.achieve';
		export type AchieveMessage = string;
		export const AchieveMessage = 'social.achieveMessage';
		export type IgnoreChannels = readonly string[];
		export const IgnoreChannels = 'social.ignoreChannels';
	}

	export namespace Starboard {
		export type Channel = string;
		export const Channel = 'starboard.channel';
		export type Emoji = string;
		export const Emoji = 'starboard.emoji';
		export type IgnoreChannels = string;
		export const IgnoreChannels = 'starboard.ignoreChannels';
		export type Minimum = number;
		export const Minimum = 'starboard.minimum';
	}

	export namespace Trigger {
		export type Alias = readonly TriggerAlias[];
		export const Alias = 'trigger.alias';
		export type Includes = readonly TriggerIncludes[];
		export const Includes = 'trigger.includes';
	}

}

export interface DisabledCommandChannel {
	channel: string;
	commands: readonly string[];
}

export interface StickyRole {
	user: string;
	roles: readonly string[];
}

export interface RolesAuto {
	id: string;
	points: number;
}

export interface RolesReaction {
	emoji: string;
	role: string;
}

export interface TriggerAlias {
	input: string;
	output: string;
}

export interface TriggerIncludes {
	action: 'react';
	input: string;
	output: string;
}

export interface UniqueRoleSet {
	name: string;
	roles: readonly string[];
}
