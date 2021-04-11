import { LanguageKeys } from '#lib/i18n/languageKeys';
import { parseRange } from '#utils/util';
import { Argument, ArgumentContext } from '@sapphire/framework';

export class UserArgument extends Argument<number[]> {
	public run(parameter: string, context: ArgumentContext) {
		const number = Number(parameter);
		if (Number.isSafeInteger(number)) return this.ok([number]);

		const range = parseRange(parameter);
		if (range.length === 0) return this.error({ parameter, identifier: LanguageKeys.Arguments.RangeInvalid, context });
		if (typeof context.maximum === 'number' && range.length > context.maximum) {
			return this.error({ parameter, identifier: LanguageKeys.Arguments.RangeMax, context: { ...context, count: context.maximum } });
		}

		return this.ok(range);
	}
}
