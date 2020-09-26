import { T } from '@lib/types/Shared';
import { LanguageHelpDisplayOptions } from '@utils/LanguageHelp';

export const FollowageDescription = T<string>('commandFollowageDescription');
export const FollowageExtended = T<LanguageHelpDisplayOptions>('commandFollowageExtended');
export const TwitchDescription = T<string>('commandTwitchDescription');
export const TwitchExtended = T<LanguageHelpDisplayOptions>('commandTwitchExtended');
export const TwitchSubscriptionDescription = T<string>('commandTwitchSubscriptionDescription');
export const TwitchSubscriptionExtended = T<LanguageHelpDisplayOptions>('commandTwitchSubscriptionExtended');
export const Followage = T<(params: { user: string; channel: string; time: number }) => string>('comm');
export const FollowageMissingEntries = T<string>('commandFollowageMissingEntries');
export const FollowageNotFollowing = T<string>('commandFollowageNotFollowing');
export const TwitchNoEntries = T<string>('commandTwitchNoEntries');
export const TwitchTitles = T<{
	followers: string;
	views: string;
	clickToVisit: string;
	partner: string;
}>('commandTwitchTitles');
export const TwitchPartnershipWithoutAffiliate = T<string>('commandTwitchPartnershipWithoutAffiliate');
export const TwitchAffiliateStatus = T<{
	affiliated: string;
	partnered: string;
}>('commandTwitchAffiliateStatus');
export const TwitchCreatedAt = T<string>('commandTwitchCreatedAt');
export const TwitchSubscriptionRequiredStreamer = T<string>('commandTwitchSubscriptionRequiredStreamer');
export const TwitchSubscriptionStreamerNotFound = T<string>('commandTwitchSubscriptionStreamerNotFound');
export const TwitchSubscriptionRequiredChannel = T<string>('commandTwitchSubscriptionRequiredChannel');
export const TwitchSubscriptionRequiredStatus = T<string>('commandTwitchSubscriptionRequiredStatus');
export const TwitchSubscriptionStatusValues = T<[string, string]>('commandTwitchSubscriptionStatusValues');
export const TwitchSubscriptionInvalidStatus = T<string>('commandTwitchSubscriptionInvalidStatus');
export const TwitchSubscriptionRequiredContent = T<string>('commandTwitchSubscriptionRequiredContent');
export const TwitchSubscriptionAddDuplicated = T<string>('commandTwitchSubscriptionAddDuplicated');
export const TwitchSubscriptionAddSuccessOffline = T<(params: { name: string; channel: string }) => string>(
	'commandTwitchSubscriptionAddSuccessOffline'
);
export const TwitchSubscriptionAddSuccessLive = T<(params: { name: string; channel: string }) => string>('commandTwitchSubscriptionAddSuccessLive');
export const TwitchSubscriptionRemoveStreamerNotSubscribed = T<string>('commandTwitchSubscriptionRemoveStreamerNotSubscribed');
export const TwitchSubscriptionRemoveEntryNotExists = T<string>('commandTwitchSubscriptionRemoveEntryNotExists');
export const TwitchSubscriptionRemoveSuccessOffline = T<(params: { name: string; channel: string }) => string>(
	'commandTwitchSubscriptionRemoveSuccessOffline'
);
export const TwitchSubscriptionRemoveSuccessLive = T<(params: { name: string; channel: string }) => string>(
	'commandTwitchSubscriptionRemoveSuccessLive'
);
export const TwitchSubscriptionResetEmpty = T<string>('commandTwitchSubscriptionResetEmpty');
export const TwitchSubscriptionResetSuccess = T<(params: { count: number }) => string>('commandTwitchSubscriptionResetSuccess');
export const TwitchSubscriptionResetSuccessPlural = T<(params: { count: number }) => string>('commandTwitchSubscriptionResetSuccessPlural');
export const TwitchSubscriptionResetStreamerNotSubscribed = T<string>('commandTwitchSubscriptionResetStreamerNotSubscribed');
export const TwitchSubscriptionResetChannelSuccess = T<(params: { name: string; count: number }) => string>(
	'commandTwitchSubscriptionResetChannelSuccess'
);
export const TwitchSubscriptionResetChannelSuccessPlural = T<(params: { name: string; count: number }) => string>(
	'commandTwitchSubscriptionResetChannelSuccessPlural'
);
export const TwitchSubscriptionShowStreamerNotSubscribed = T<string>('commandTwitchSubscriptionShowStreamerNotSubscribed');
export const TwitchSubscriptionShowStatus = T<[string, string]>('commandTwitchSubscriptionShowStatus');
export const TwitchSubscriptionShowEmpty = T<string>('commandTwitchSubscriptionShowEmpty');
export const TwitchSubscriptionShowUnknownUser = T<string>('commandTwitchSubscriptionShowUnknownUser');
