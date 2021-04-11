import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	description: LanguageKeys.Commands.Weeb.SlapDescription,
	extendedHelp: LanguageKeys.Commands.Weeb.SlapExtended,
	queryType: 'slap',
	responseName: LanguageKeys.Commands.Weeb.Slap,
	requireUser: true
})
export class UserWeebCommand extends WeebCommand {}
