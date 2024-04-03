import { GuildSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SelfModerationCommand } from '#lib/moderation';
import { ApplyOptions } from '@sapphire/decorators';

const Root = LanguageKeys.Commands.Management;
const SettingsRoot = GuildSettings.Selfmod.Links;

@ApplyOptions<SelfModerationCommand.Options>({
	description: Root.LinksDescription,
	localizedNameKey: Root.LinksName,
	adderPropertyName: 'links',
	keyEnabled: SettingsRoot.Enabled,
	keyOnInfraction: SettingsRoot.SoftAction,
	keyPunishment: SettingsRoot.HardAction,
	keyPunishmentDuration: SettingsRoot.HardActionDuration,
	keyPunishmentThreshold: SettingsRoot.ThresholdMaximum,
	keyPunishmentThresholdPeriod: SettingsRoot.ThresholdDuration
})
export class UserSelfModerationCommand extends SelfModerationCommand {}
