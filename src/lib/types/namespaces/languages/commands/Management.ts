import { FT, T } from '@lib/types/Shared';
import { LanguageHelpDisplayOptions } from '@utils/LanguageHelp';
import { Role, User } from 'discord.js';

export const ManageAttachmentsDescription = T<string>('commandManageAttachmentsDescription');
export const ManageAttachmentsExtended = T<LanguageHelpDisplayOptions>('commandManageAttachmentsExtended');
export const ManageAttachmentsRequiredValue = T<string>('commandManageAttachmentsRequiredValue');
export const ManageAttachmentsInvalidAction = T<string>('commandManageAttachmentsInvalidAction');
export const ManageAttachmentsMaximum = FT<{ value: number }, string>('commandManageAttachmentsMaximum');
export const ManageAttachmentsExpire = FT<{ value: number }, string>('commandManageAttachmentsExpire');
export const ManageAttachmentsDuration = FT<{ value: number }, string>('commandManageAttachmentsDuration');
export const ManageAttachmentsAction = T<string>('commandManageAttachmentsAction');
export const ManageAttachmentsLogs = T<string>('commandManageAttachmentsLogs');
export const ManageAttachmentsEnabled = T<string>('commandManageAttachmentsEnabled');
export const ManageAttachmentsDisabled = T<string>('commandManageAttachmentsDisabled');
export const ManageCommandAutoDeleteTextChannel = T<string>('commandManageCommandAutoDeleteTextChannel');
export const ManageCommandAutoDeleteRequiredDuration = T<string>('commandManageCommandAutoDeleteRequiredDuration');
export const ManageCommandAutoDeleteShowEmpty = T<string>('commandManageCommandAutoDeleteShowEmpty');
export const ManageCommandAutoDeleteShow = FT<{ codeblock: string }, string>('commandManageCommandAutoDeleteShow');
export const ManageCommandAutoDeleteAdd = FT<{ channel: string; time: number }, string>('commandManageCommandAutoDeleteAdd');
export const ManageCommandAutoDeleteRemove = FT<{ channel: string }, string>('commandManageCommandAutoDeleteRemove');
export const ManageCommandAutoDeleteRemoveNotset = FT<{ channel: string }, string>('commandManageCommandAutoDeleteRemoveNotset');
export const ManageCommandAutoDeleteReset = T<string>('commandManageCommandAutoDeleteReset');
export const ManageCommandChannelTextChannel = T<string>('commandManageCommandChannelTextChannel');
export const ManageCommandChannelRequiredCommand = T<string>('commandManageCommandChannelRequiredCommand');
export const ManageCommandChannelShow = FT<{ channel: string; commands: string }, string>('commandManageCommandChannelShow');
export const ManageCommandChannelShowEmpty = T<string>('commandManageCommandChannelShowEmpty');
export const ManageCommandChannelAddAlreadyset = T<string>('commandManageCommandChannelAddAlreadyset');
export const ManageCommandChannelAdd = FT<{ channel: string; command: string }, string>('commandManageCommandChannelAdd');
export const ManageCommandChannelRemoveNotset = FT<{ channel: string }, string>('commandManageCommandChannelRemoveNotset');
export const ManageCommandChannelRemove = FT<{ channel: string; command: string }, string>('commandManageCommandChannelRemove');
export const ManageCommandChannelResetEmpty = T<string>('commandManageCommandChannelResetEmpty');
export const ManageCommandChannelReset = FT<{ channel: string }, string>('commandManageCommandChannelReset');
export const ManageReactionRolesShowEmpty = T<string>('commandManageReactionRolesShowEmpty');
export const ManageReactionRolesAddPrompt = T<string>('commandManageReactionRolesAddPrompt');
export const ManageReactionRolesAddChannel = FT<{ emoji: string; channel: string }, string>('commandManageReactionRolesAddChannel');
export const ManageReactionRolesAddMissing = T<string>('commandManageReactionRolesAddMissing');
export const ManageReactionRolesAdd = FT<{ emoji: string; url: string }, string>('commandManageReactionRolesAdd');
export const ManageReactionRolesRemoveNotExists = T<string>('commandManageReactionRolesRemoveNotExists');
export const ManageReactionRolesRemove = FT<{ emoji: string; url: string }, string>('commandManageReactionRolesRemove');
export const ManageReactionRolesResetEmpty = T<string>('commandManageReactionRolesResetEmpty');
export const ManageReactionRolesReset = T<string>('commandManageReactionRolesReset');
export const SetStarboardEmojiSet = FT<{ emoji: string }, string>('commandSetStarboardEmojiSet');
export const ManageCommandChannelDescription = T<string>('commandManageCommandChannelDescription');
export const ManageCommandChannelExtended = T<LanguageHelpDisplayOptions>('commandManageCommandChannelExtended');
export const ManageReactionRolesDescription = T<string>('commandManageReactionRolesDescription');
export const ManageReactionRolesExtended = T<LanguageHelpDisplayOptions>('commandManageReactionRolesExtended');
export const SetIgnoreChannelsDescription = T<string>('commandSetIgnoreChannelsDescription');
export const SetIgnoreChannelsExtended = T<LanguageHelpDisplayOptions>('commandSetIgnoreChannelsExtended');
export const SetImageLogsDescription = T<string>('commandSetImageLogsDescription');
export const SetImageLogsExtended = T<LanguageHelpDisplayOptions>('commandSetImageLogsExtended');
export const SetMemberLogsDescription = T<string>('commandSetMemberLogsDescription');
export const SetMemberLogsExtended = T<LanguageHelpDisplayOptions>('commandSetMemberLogsExtended');
export const SetMessageLogsDescription = T<string>('commandSetMessageLogsDescription');
export const SetMessageLogsExtended = T<LanguageHelpDisplayOptions>('commandSetMessageLogsExtended');
export const SetmodlogsDescription = T<string>('commandSetmodlogsDescription');
export const SetmodlogsExtended = T<LanguageHelpDisplayOptions>('commandSetmodlogsExtended');
export const SetprefixDescription = T<string>('commandSetprefixDescription');
export const SetprefixExtended = T<LanguageHelpDisplayOptions>('commandSetprefixExtended');
export const SetIgnoreChannelsSet = FT<{ channel: string }, string>('commandSetIgnoreChannelsSet');
export const SetIgnoreChannelsRemoved = FT<{ channel: string }, string>('commandSetIgnoreChannelsRemoved');
export const SetImageLogsSet = FT<{ channel: string }, string>('commandSetImageLogsSet');
export const SetMemberLogsSet = FT<{ channel: string }, string>('commandSetMemberLogsSet');
export const SetMessageLogsSet = FT<{ channel: string }, string>('commandSetMessageLogsSet');
export const SetModLogsSet = FT<{ channel: string }, string>('commandSetModLogsSet');
export const SetPrefixSet = FT<{ prefix: string }, string>('commandSetPrefixSet');
export const SetStarboardEmojiDescription = T<string>('commandSetStarboardEmojiDescription');
export const SetStarboardEmojiExtended = T<LanguageHelpDisplayOptions>('commandSetStarboardEmojiExtended');
export const CreateMuteDescription = T<string>('commandCreateMuteDescription');
export const CreateMuteExtended = T<LanguageHelpDisplayOptions>('commandCreateMuteExtended');
export const NickDescription = T<string>('commandNickDescription');
export const NickExtended = T<LanguageHelpDisplayOptions>('commandNickExtended');
export const PermissionNodesDescription = T<string>('commandPermissionNodesDescription');
export const PermissionNodesExtended = T<LanguageHelpDisplayOptions>('commandPermissionNodesExtended');
export const TriggersDescription = T<string>('commandTriggersDescription');
export const TriggersExtended = T<LanguageHelpDisplayOptions>('commandTriggersExtended');
export const ManagecommandautodeleteDescription = T<string>('commandManagecommandautodeleteDescription');
export const ManagecommandautodeleteExtended = T<LanguageHelpDisplayOptions>('commandManagecommandautodeleteExtended');
export const SetrolechannelDescription = T<string>('commandSetrolechannelDescription');
export const SetrolechannelExtended = T<LanguageHelpDisplayOptions>('commandSetrolechannelExtended');
export const SetrolemessageDescription = T<string>('commandSetrolemessageDescription');
export const SetrolemessageExtended = T<LanguageHelpDisplayOptions>('commandSetrolemessageExtended');
export const RoleInfoDescription = T<string>('commandRoleInfoDescription');
export const RoleInfoExtended = T<LanguageHelpDisplayOptions>('commandRoleInfoExtended');
export const GuildInfoDescription = T<string>('commandGuildInfoDescription');
export const GuildInfoExtended = T<LanguageHelpDisplayOptions>('commandGuildInfoExtended');
export const StickyRolesDescription = T<string>('commandStickyRolesDescription');
export const StickyRolesExtended = T<LanguageHelpDisplayOptions>('commandStickyRolesExtended');
export const CapitalsModeDescription = T<string>('commandCapitalsModeDescription');
export const CapitalsModeExtended = T<LanguageHelpDisplayOptions>('commandCapitalsModeExtended');
export const FilterDescription = T<string>('commandFilterDescription');
export const FilterExtended = T<LanguageHelpDisplayOptions>('commandFilterExtended');
export const FilterModeDescription = T<string>('commandFilterModeDescription');
export const FilterModeExtended = T<LanguageHelpDisplayOptions>('commandFilterModeExtended');
export const InviteModeDescription = T<string>('commandInviteModeDescription');
export const InviteModeExtended = T<LanguageHelpDisplayOptions>('commandInviteModeExtended');
export const LinkModeDescription = T<string>('commandLinkModeDescription');
export const LinkModeExtended = T<LanguageHelpDisplayOptions>('commandLinkModeExtended');
export const MessageModeDescription = T<string>('commandMessageModeDescription');
export const MessageModeExtended = T<LanguageHelpDisplayOptions>('commandMessageModeExtended');
export const NewlineModeDescription = T<string>('commandNewlineModeDescription');
export const NewlineModeExtended = T<LanguageHelpDisplayOptions>('commandNewlineModeExtended');
export const ReactionModeDescription = T<string>('commandReactionModeDescription');
export const ReactionModeExtended = T<LanguageHelpDisplayOptions>('commandReactionModeExtended');
export const GuildInfoTitles = T<Record<string, string>>('commandGuildInfoTitles');
export const GuildInfoRoles = FT<{ roles: string }, string>('commandGuildInfoRoles');
export const GuildInfoNoroles = T<string>('commandGuildInfoNoroles');
export const GuildInfoChannels = FT<{ text: number; voice: number; categories: number; afkChannelText: string }, string[]>(
	'commandGuildInfoChannels'
);
export const GuildInfoChannelsAfkChannelText = FT<{ afkChannel: string; afkTime: number }, string>('commandGuildInfoChannelsAfkChannelText');
export const GuildInfoMembers = FT<{ count: string; owner: User }, string[]>('commandGuildInfoMembers');
export const GuildInfoOther = FT<
	{ size: number; region: string; createdAt: number; verificationLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' },
	string[]
>('commandGuildInfoOther');
export const RoleInfoTitles = T<Record<string, string>>('commandRoleInfoTitles');
export const RoleInfoData = FT<{ role: Role; hoisted: string; mentionable: string }, string[]>('commandRoleInfoData');
export const RoleInfoAll = T<string>('commandRoleInfoAll');
export const RoleInfoNoPermissions = T<string>('commandRoleInfoNoPermissions');
export const FilterUndefinedWord = T<string>('commandFilterUndefinedWord');
export const FilterAlreadyFiltered = T<string>('commandFilterAlreadyFiltered');
export const FilterNotFiltered = T<string>('commandFilterNotFiltered');
export const FilterAdded = FT<{ word: string }, string>('commandFilterAdded');
export const FilterRemoved = FT<{ word: string }, string>('commandFilterRemoved');
export const FilterReset = T<string>('commandFilterReset');
export const FilterShowEmpty = T<string>('commandFilterShowEmpty');
export const FilterShow = FT<{ words: string }, string>('commandFilterShow');
export const StickyRolesRequiredUser = T<string>('commandStickyRolesRequiredUser');
export const StickyRolesRequiredRole = T<string>('commandStickyRolesRequiredRole');
export const StickyRolesNotExists = FT<{ user: string }, string>('commandStickyRolesNotExists');
export const StickyRolesReset = FT<{ user: string }, string>('commandStickyRolesReset');
export const StickyRolesRemove = FT<{ user: string }, string>('commandStickyRolesRemove');
export const StickyRolesAddExists = FT<{ user: string }, string>('commandStickyRolesAddExists');
export const StickyRolesAdd = FT<{ user: string }, string>('commandStickyRolesAdd');
export const StickyRolesShowEmpty = T<string>('commandStickyRolesShowEmpty');
export const StickyRolesShowSingle = FT<{ user: string; roles: string }, string>('commandStickyRolesShowSingle');
export const NickSet = FT<{ nickname: string }, string>('commandNickSet');
export const NickCleared = T<string>('commandNickCleared');
export const PermissionNodesHigher = T<string>('commandPermissionNodesHigher');
export const PermissionNodesInvalidType = T<string>('commandPermissionNodesInvalidType');
export const PermissionNodesAdd = T<string>('commandPermissionNodesAdd');
export const PermissionNodesNodeNotExists = T<string>('commandPermissionNodesNodeNotExists');
export const PermissionNodesCommandNotExists = T<string>('commandPermissionNodesCommandNotExists');
export const PermissionNodesRemove = T<string>('commandPermissionNodesRemove');
export const PermissionNodesReset = T<string>('commandPermissionNodesReset');
export const PermissionNodesShowName = FT<{ name: string }, string>('commandPermissionNodesShowName');
export const PermissionNodesShowAllow = FT<{ allow: string }, string>('commandPermissionNodesShowAllow');
export const PermissionNodesShowDeny = FT<{ deny: string }, string>('commandPermissionNodesShowDeny');
export const RolesDescription = T<string>('commandRolesDescription');
export const RolesExtended = T<LanguageHelpDisplayOptions>('commandRolesExtended');
export const RolesListEmpty = T<string>('commandRolesListEmpty');
export const RolesAbort = FT<{ prefix: string }, string>('commandRolesAbort');
export const RolesListTitle = T<string>('commandRolesListTitle');
export const RolesAdded = FT<{ roles: string }, string>('commandRolesAdded');
export const RolesRemoved = FT<{ roles: string }, string>('commandRolesRemoved');
export const RolesNotPublic = FT<{ roles: string }, string>('commandRolesNotPublic');
export const RolesNotManageable = FT<{ roles: string }, string>('commandRolesNotManageable');
export const RolesAuditlog = T<string>('commandRolesAuditlog');
export const TriggersNotype = T<string>('commandTriggersNotype');
export const TriggersNooutput = T<string>('commandTriggersNooutput');
export const TriggersInvalidreaction = T<string>('commandTriggersInvalidreaction');
export const TriggersInvalidalias = T<string>('commandTriggersInvalidalias');
export const TriggersRemoveNottaken = T<string>('commandTriggersRemoveNottaken');
export const TriggersRemove = T<string>('commandTriggersRemove');
export const TriggersAddTaken = T<string>('commandTriggersAddTaken');
export const TriggersAdd = T<string>('commandTriggersAdd');
export const TriggersListEmpty = T<string>('commandTriggersListEmpty');
