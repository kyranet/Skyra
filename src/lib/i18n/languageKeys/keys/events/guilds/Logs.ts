import { Difference, FT, T } from '#lib/types';
import type { DefaultMessageNotifications, ExplicitContentFilterLevel, VerificationLevel } from 'discord.js';

type Notifications = DefaultMessageNotifications | number;

export const ChannelCreate = T('events/guild-logs:channelCreate');
export const ChannelCreateName = FT<{ value: string }>('events/guild-logs:channelCreateName');
export const ChannelCreateParent = FT<{ value: string }>('events/guild-logs:channelCreateParent');
export const ChannelCreatePosition = FT<{ value: number }>('events/guild-logs:channelCreatePosition');
export const ChannelCreateNsfw = FT<{ value: string }>('events/guild-logs:channelCreateNsfw');
export const ChannelCreateTopic = FT<{ value: string }>('events/guild-logs:channelCreateTopic');
export const ChannelCreateRateLimit = FT<{ value: number }>('events/guild-logs:channelCreateRateLimit');
export const ChannelCreateBitrate = FT<{ value: number }>('events/guild-logs:channelCreateBitrate');
export const ChannelCreateUserLimit = FT<{ value: number }>('events/guild-logs:channelCreateUserLimit');
export const ChannelUpdate = T('events/guild-logs:channelUpdate');
export const ChannelUpdateBitrate = FT<Difference<number>>('events/guild-logs:channelUpdateBitrate');
export const ChannelUpdateName = FT<Difference<string>>('events/guild-logs:channelUpdateName');
export const ChannelUpdateNsfw = FT<Difference<string>>('events/guild-logs:channelUpdateNsfw');
export const ChannelUpdateParent = FT<Difference<string>>('events/guild-logs:channelUpdateParent');
export const ChannelUpdateParentAdded = FT<{ channel: string }>('events/guild-logs:channelUpdateParentAdded');
export const ChannelUpdateParentRemoved = FT<{ channel: string }>('events/guild-logs:channelUpdateParentRemoved');
export const ChannelUpdatePosition = FT<Difference<number>>('events/guild-logs:channelUpdatePosition');
export const ChannelUpdateRateLimit = FT<Difference<number>>('events/guild-logs:channelUpdateRateLimit');
export const ChannelUpdateRateLimitAdded = FT<{ rateLimit: number }>('events/guild-logs:channelUpdateRateLimitAdded');
export const ChannelUpdateRateLimitRemoved = FT<{ rateLimit: number }>('events/guild-logs:channelUpdateRateLimitRemoved');
export const ChannelUpdateTopic = FT<Difference<string>>('events/guild-logs:channelUpdateTopic');
export const ChannelUpdateTopicAdded = FT<{ topic: string }>('events/guild-logs:channelUpdateTopicAdded');
export const ChannelUpdateTopicRemoved = FT<{ topic: string }>('events/guild-logs:channelUpdateTopicRemoved');
export const ChannelUpdateType = FT<Difference<string>>('events/guild-logs:channelUpdateType');
export const ChannelUpdateUserLimit = FT<Difference<number>>('events/guild-logs:channelUpdateUserLimit');
export const ChannelUpdateUserLimitAdded = FT<{ userLimit: string }>('events/guild-logs:channelUpdateUserLimitAdded');
export const ChannelUpdateUserLimitRemoved = FT<{ userLimit: string }>('events/guild-logs:channelUpdateUserLimitRemoved');
export const EmojiUpdate = T('events/guild-logs:emojiUpdate');
export const EmojiUpdateAnimated = FT<Difference<string>>('events/guild-logs:emojiUpdateAnimated');
export const EmojiUpdateAvailable = FT<Difference<string>>('events/guild-logs:emojiUpdateAvailable');
export const EmojiUpdateManaged = FT<Difference<string>>('events/guild-logs:emojiUpdateManaged');
export const EmojiUpdateName = FT<Difference<string>>('events/guild-logs:emojiUpdateName');
export const EmojiUpdateRequiresColons = FT<Difference<string>>('events/guild-logs:emojiUpdateRequiresColons');
export const EmojiUpdateRolesAdded = FT<{ roles: string[]; count: number }>('events/guild-logs:emojiUpdateRolesAdded');
export const EmojiUpdateRolesRemoved = FT<{ roles: string[]; count: number }>('events/guild-logs:emojiUpdateRolesRemoved');
export const RoleCreate = T('events/guild-logs:roleCreate');
export const RoleCreateColor = FT<{ value: string }>('events/guild-logs:roleCreateColor');
export const RoleCreateHoist = T('events/guild-logs:roleCreateHoist');
export const RoleCreateMentionable = T('events/guild-logs:roleCreateMentionable');
export const RoleCreateName = FT<{ value: string }>('events/guild-logs:roleCreateName');
export const RoleCreatePermissions = FT<{ permissions: string[]; count: number }>('events/guilds-logs:roleCreatePermissions');
export const RoleCreatePosition = FT<{ value: number }>('events/guild-logs:roleCreatePosition');
export const RoleUpdate = T('events/guilds-logs:roleUpdate');
export const RoleUpdateColor = FT<Difference<string>>('events/guilds-logs:roleUpdateColor');
export const RoleUpdateHoist = FT<Difference<string>>('events/guilds-logs:roleUpdateHoist');
export const RoleUpdateMentionable = FT<Difference<string>>('events/guilds-logs:roleUpdateMentionable');
export const RoleUpdateName = FT<Difference<string>>('events/guilds-logs:roleUpdateName');
export const RoleUpdatePermissionsAdded = FT<{ permissions: string[]; count: number }>('events/guilds-logs:roleUpdatePermissionsAdded');
export const RoleUpdatePermissionsRemoved = FT<{ permissions: string[]; count: number }>('events/guilds-logs:roleUpdatePermissionsRemoved');
export const RoleUpdatePosition = FT<Difference<number>>('events/guilds-logs:roleUpdatePosition');
export const ServerUpdate = T('events/guilds-logs:serverUpdate');
export const ServerUpdateAfkChannelAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateAfkChannelAdded');
export const ServerUpdateAfkChannelRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateAfkChannelRemoved');
export const ServerUpdateAfkChannel = FT<Difference<string>>('events/guilds-logs:serverUpdateAfkChannel');
export const ServerUpdateAfkTimeout = FT<Difference<number>>('events/guilds-logs:serverUpdateAfkTimeout');
export const ServerUpdateBannerAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateBannerAdded');
export const ServerUpdateBannerRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateBannerRemoved');
export const ServerUpdateBanner = FT<Difference<string>>('events/guilds-logs:serverUpdateBanner');
export const ServerUpdateDefaultMessageNotifications = FT<Difference<Notifications>>('events/guilds-logs:serverUpdateDefaultMessageNotifications');
export const ServerUpdateDescriptionAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateDescriptionAdded');
export const ServerUpdateDescriptionRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateDescriptionRemoved');
export const ServerUpdateDescription = FT<Difference<string>>('events/guilds-logs:serverUpdateDescription');
export const ServerUpdateDiscoverySplashAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateDiscoverySplashAdded');
export const ServerUpdateDiscoverySplashRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateDiscoverySplashRemoved');
export const ServerUpdateDiscoverySplash = FT<Difference<string>>('events/guilds-logs:serverUpdateDiscoverySplash');
export const ServerUpdateExplicitContentFilter = FT<Difference<ExplicitContentFilterLevel>>('events/guilds-logs:serverUpdateExplicitContentFilter');
export const ServerUpdateFeaturesAdded = FT<{ values: string[] }>('events/guilds-logs:serverUpdateFeaturesAdded');
export const ServerUpdateFeaturesRemoved = FT<{ values: string[] }>('events/guilds-logs:serverUpdateFeaturesRemoved');
export const ServerUpdateIconAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateIconAdded');
export const ServerUpdateIconRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateIconRemoved');
export const ServerUpdateIcon = FT<Difference<string>>('events/guilds-logs:serverUpdateIcon');
export const ServerUpdateMaximumMembersAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateMaximumMembersAdded');
export const ServerUpdateMaximumMembersRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateMaximumMembersRemoved');
export const ServerUpdateMaximumMembers = FT<Difference<string>>('events/guilds-logs:serverUpdateMaximumMembers');
export const ServerUpdateMaximumPresencesAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateMaximumPresencesAdded');
export const ServerUpdateMaximumPresencesRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateMaximumPresencesRemoved');
export const ServerUpdateMaximumPresences = FT<Difference<string>>('events/guilds-logs:serverUpdateMaximumPresences');
export const ServerUpdateMfaAdded = T('events/guilds-logs:serverUpdateMfaAdded');
export const ServerUpdateMfaRemoved = T('events/guilds-logs:serverUpdateMfaRemoved');
export const ServerUpdateName = FT<Difference<string>>('events/guilds-logs:serverUpdateName');
export const ServerUpdateOwner = FT<Difference<string>>('events/guilds-logs:serverUpdateOwner');
export const ServerUpdatePreferredLocale = FT<Difference<string>>('events/guilds-logs:serverUpdatePreferredLocale');
export const ServerUpdatePremiumSubscriptionCountAdded = FT<{ value: string }>('events/guilds-logs:serverUpdatePremiumSubscriptionCountAdded');
export const ServerUpdatePremiumSubscriptionCountRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdatePremiumSubscriptionCountRemoved');
export const ServerUpdatePremiumSubscriptionCount = FT<Difference<string>>('events/guilds-logs:serverUpdatePremiumSubscriptionCount');
export const ServerUpdatePremiumTier = FT<Difference<number>>('events/guilds-logs:serverUpdatePremiumTier');
export const ServerUpdatePublicUpdatesChannelAdded = FT<{ value: string }>('events/guilds-logs:serverUpdatePublicUpdatesChannelAdded');
export const ServerUpdatePublicUpdatesChannelRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdatePublicUpdatesChannelRemoved');
export const ServerUpdatePublicUpdatesChannel = FT<Difference<string>>('events/guilds-logs:serverUpdatePublicUpdatesChannel');
export const ServerUpdateRegion = FT<Difference<string>>('events/guilds-logs:serverUpdateRegion');
export const ServerUpdateRulesChannelAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateRulesChannelAdded');
export const ServerUpdateRulesChannelRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateRulesChannelRemoved');
export const ServerUpdateRulesChannel = FT<Difference<string>>('events/guilds-logs:serverUpdateRulesChannel');
export const ServerUpdateSplashAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateSplashAdded');
export const ServerUpdateSplashRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateSplashRemoved');
export const ServerUpdateSplash = FT<Difference<string>>('events/guilds-logs:serverUpdateSplash');
export const ServerUpdateSystemChannelFlagsAdded = FT<{ values: string[] }>('events/guilds-logs:serverUpdateSystemChannelFlagsAdded');
export const ServerUpdateSystemChannelFlagsRemoved = FT<{ values: string[] }>('events/guilds-logs:serverUpdateSystemChannelFlagsRemoved');
export const ServerUpdateSystemChannelAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateSystemChannelAdded');
export const ServerUpdateSystemChannelRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateSystemChannelRemoved');
export const ServerUpdateSystemChannel = FT<Difference<string>>('events/guilds-logs:serverUpdateSystemChannel');
export const ServerUpdateVanityUrlAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateVanityUrlAdded');
export const ServerUpdateVanityUrlRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateVanityUrlRemoved');
export const ServerUpdateVanityUrl = FT<Difference<string>>('events/guilds-logs:serverUpdateVanityUrl');
export const ServerUpdateVerificationLevel = FT<Difference<VerificationLevel>>('events/guilds-logs:serverUpdateVerificationLevel');
export const ServerUpdateWidgetChannelAdded = FT<{ value: string }>('events/guilds-logs:serverUpdateWidgetChannelAdded');
export const ServerUpdateWidgetChannelRemoved = FT<{ value: string }>('events/guilds-logs:serverUpdateWidgetChannelRemoved');
export const ServerUpdateWidgetChannel = FT<Difference<string>>('events/guilds-logs:serverUpdateWidgetChannel');
export const ServerUpdateWidgetEnabled = T('events/guilds-logs:serverUpdateWidgetEnabled');
export const ServerUpdateWidgetDisabled = T('events/guilds-logs:serverUpdateWidgetDisabled');
