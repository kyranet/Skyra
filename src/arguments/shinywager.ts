import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ApplyOptions } from '@sapphire/decorators';
import { ExtendedArgument, ExtendedArgumentContext, ExtendedArgumentOptions } from '@sapphire/framework';

@ApplyOptions<ExtendedArgumentOptions<'integer'>>({ aliases: ['wager'], baseArgument: 'integer' })
export default class ShinyWager extends ExtendedArgument<'integer', number> {
	public handle(value: number, context: ExtendedArgumentContext) {
		if (ShinyWager.kValidAmounts.includes(value)) return this.ok(value);
		return this.error({
			parameter: context.parameter,
			identifier: LanguageKeys.Resolvers.InvalidWager,
			context: {
				possibles: ShinyWager.kValidAmounts.map((a) => a.toString())
			}
		});
	}

	public static readonly kValidAmounts = [50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 25_000, 50_000, 100_000, 500_000];
}
