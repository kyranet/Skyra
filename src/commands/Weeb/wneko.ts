import { LanguageKeys } from '#lib/i18n/languageKeys';
import { WeebCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<WeebCommand.Options>({
	description: LanguageKeys.Commands.Weeb.NekoDescription,
	extendedHelp: LanguageKeys.Commands.Weeb.NekoExtended,
	queryType: 'neko',
	responseName: LanguageKeys.Commands.Weeb.Neko
})
export class UserWeebCommand extends WeebCommand {}
