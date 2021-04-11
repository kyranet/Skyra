import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	description: LanguageKeys.Commands.Weeb.NomDescription,
	extendedHelp: LanguageKeys.Commands.Weeb.NomExtended,
	queryType: 'nom',
	responseName: LanguageKeys.Commands.Weeb.Nom
})
export class UserWeebCommand extends WeebCommand {}
