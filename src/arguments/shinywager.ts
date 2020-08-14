import { ApplyOptions } from '@skyra/decorators';
import { Argument, ArgumentOptions, KlasaMessage, Possible } from 'klasa';

@ApplyOptions<ArgumentOptions>({ aliases: ['wager'] })
export default class ShinyWager extends Argument {
	public run(arg: string, possible: Possible, message: KlasaMessage): number {
		if (!arg) throw message.language.get('RESOLVER_INVALID_INT', possible.name);

		const number = Number(arg) as ArrayValues<typeof ShinyWager.kValidBetAmounts>;
		if (!Number.isInteger(number)) throw message.language.tget('RESOLVER_INVALID_INT', possible.name);
		if (!ShinyWager.kValidBetAmounts.includes(number)) throw message.language.tget('RESOLVER_INVALID_WAGER', number);

		return this.integerArg.run(arg, possible, message);
	}

	private get integerArg() {
		return this.store.get('integer')!;
	}

	public static readonly kValidBetAmounts = [50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 25_000, 50_000, 100_000, 500_000] as const;
}

type ArrayValues<T extends readonly unknown[] = readonly unknown[]> = T[number];
