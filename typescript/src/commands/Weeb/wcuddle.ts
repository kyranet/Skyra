import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	description: LanguageKeys.Commands.Weeb.CuddleDescription,
	extendedHelp: LanguageKeys.Commands.Weeb.CuddleExtended,
	queryType: 'cuddle',
	responseName: LanguageKeys.Commands.Weeb.Cuddle,
	requireUser: true
})
export class UserWeebCommand extends WeebCommand {}
