import { GuildSettings } from '#lib/database/index';
import { ChannelConfigurationCommand, ChannelConfigurationCommandOptions } from '#lib/structures/ChannelConfigurationCommand';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';

@ApplyOptions<ChannelConfigurationCommandOptions>({
	description: (language) => language.get(LanguageKeys.Commands.Management.SetModerationLogsDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Management.SetModerationLogsExtended),
	responseKey: LanguageKeys.Commands.Management.SetModLogsSet,
	settingsKey: GuildSettings.Channels.ModerationLogs
})
export default class extends ChannelConfigurationCommand {}
