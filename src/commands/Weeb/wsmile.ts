import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	description: LanguageKeys.Commands.Weeb.SmileDescription,
	extendedHelp: LanguageKeys.Commands.Weeb.SmileExtended,
	queryType: 'smile',
	responseName: LanguageKeys.Commands.Weeb.Smile
})
export class UserWeebCommand extends WeebCommand {}
