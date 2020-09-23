import { FT, T } from '@lib/types/Shared';

export const ChannelNotReadable = T<string>('channelNotReadable');
export const CommandmessageMissing = T<string>('commandmessageMissing');
export const CommandmessageMissingOptionals = FT<{ possibles: string }, string>('commandmessageMissingOptionals');
export const CommandmessageMissingRequired = FT<{ name: string }, string>('commandmessageMissingRequired');
export const CommandmessageNomatch = FT<{ possibles: string }, string>('commandmessageNomatch');
export const CommandRequireRole = T<string>('commandRequireRole');
export const CommandRoleHigher = T<string>('commandRoleHigher');
export const CommandRoleHigherSkyra = T<string>('commandRoleHigherSkyra');
export const CommandScoreboardPosition = FT<{ position: number }, string>('commandScoreboardPosition');
export const CommandSuccess = T<string>('commandSuccess');
export const CommandToskyra = T<string>('commandToskyra');
export const CommandUserself = T<string>('commandUserself');
export const ConfigurationEquals = T<string>('configurationEquals');
export const ConfigurationTextChannelRequired = T<string>('configurationTextChannelRequired');
export const ConstMonitorMessagefilter = T<string>('constMonitorMessagefilter');
export const ConstMonitorNewlinefilter = T<string>('constMonitorNewlinefilter');
export const ConstUsers = T<string>('constUsers');
export const DefaultLanguage = T<string>('defaultLanguage');
export const GamesCannotHaveNegativeMone = T<string>('gamesCannotHaveNegativeMoney');
export const GamesNotEnoughMoney = FT<{ money: number }, string>('gamesNotEnoughMoney');
export const JumpTo = T<string>('jumpTo');
export const MessagePromptTimeout = T<string>('messagePromptTimeout');
export const PrefixReminder = FT<{ prefix: string }, string>('prefixReminder');
export const ReactionhandlerPrompt = T<string>('reactionhandlerPrompt');
export const RestrictionNotConfigured = T<string>('restrictionNotConfigured');
export const SettingsDeleteChannelsDefault = T<string>('settingsDeleteChannelsDefault');
export const SettingsDeleteRolesInitial = T<string>('settingsDeleteRolesInitial');
export const SettingsDeleteRolesMute = T<string>('settingsDeleteRolesMute');
export const SystemTextTruncated = FT<{ definition: string; url: string }, string>('systemTextTruncated');
export const TextPromptAbortOptions = T<readonly string[]>('textPromptAbortOptions');
export const UnexpectedIssue = T<string>('unexpectedIssue');
export const UnknownChannel = T<string>('unknownChannel');
export const UnknownRole = T<string>('unknownRole');
export const UnknownUser = T<string>('unknownUser');
export const UserNotExistent = T<string>('userNotExistent');
export const UserNotInGuild = T<string>('userNotInGuild');
