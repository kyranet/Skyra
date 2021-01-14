import { LanguageHelpDisplayOptions } from '#lib/i18n/LanguageHelp';
import { FT, T } from '#lib/types';

export const HelpAllFlag = FT<{ prefix: string }, string>('commands/general:helpAllFlag');
export const HelpCommandCount = FT<{ count: number }, string>('commands/general:helpCommandCount');
export const HelpDescription = T<string>('commands/general:helpDescription');
export const HelpExtended = T<LanguageHelpDisplayOptions>('commands/general:helpExtended');
export const HelpData = FT<
	{
		titleDescription: string;
		usage: string;
		extendedHelp: string;
		footerName: string;
	},
	{
		title: string;
		usage: string;
		extended: string;
		footer: string;
	}
>('commands/general:helpData');
export const HelpDm = T<string>('commands/general:helpDm');
export const HelpNoDm = T<string>('commands/general:helpNodm');
export const HelpNoExtended = T<LanguageHelpDisplayOptions>('commands/general:helpNoExtended');
export const InfoBody = T<string>('commands/general:infoBody');
export const InfoDescription = T<string>('commands/general:infoDescription');
export const InfoExtended = T<LanguageHelpDisplayOptions>('commands/general:infoExtended');
export const InviteDescription = T<string>('commands/general:inviteDescription');
export const InviteExtended = T<LanguageHelpDisplayOptions>('commands/general:inviteExtended');
export const InvitePermissionInviteText = T<string>('commands/general:invitePermissionInviteText');
export const InvitePermissionsDescription = T<string>('commands/general:invitePermissionsDescription');
export const InvitePermissionSupportServerText = T<string>('commands/general:invitePermissionSupportServerText');
export const Ping = T<string>('commands/general:ping');
export const PingDescription = T<string>('commands/general:pingDescription');
export const PingExtended = T<LanguageHelpDisplayOptions>('commands/general:pingExtended');
export const PingPong = FT<{ diff: number; ping: number }, string>('commands/general:pingPong');
