import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	aliases: ['wsalute'],
	description: LanguageKeys.Commands.Weeb.GreetDescription,
	detailedDescription: LanguageKeys.Commands.Weeb.GreetExtended,
	queryType: 'greet',
	responseName: LanguageKeys.Commands.Weeb.Greet,
	requireUser: true
})
export class UserWeebCommand extends WeebCommand {}
