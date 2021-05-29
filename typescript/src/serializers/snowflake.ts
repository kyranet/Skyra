import { Serializer, SerializerUpdateContext } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { UserError } from '@sapphire/framework';
import { DiscordSnowflake } from '@sapphire/snowflake';
import type { Awaited } from '@sapphire/utilities';

export class UserSerializer extends Serializer<string> {
	/**
	 * The validator, requiring all numbers and 17 to 19 digits (future-proof).
	 */
	private readonly kRegExp = /^\d{17,19}$/;

	/**
	 * Stanislav's join day, known as the oldest user in Discord, and practically
	 * the lowest snowflake we can get (as they're bound by the creation date).
	 */
	private readonly kMinimum = new Date(2015, 1, 28).getTime();

	public async parse(args: Serializer.Args) {
		return this.result(args, await args.pickResult('snowflake'));
	}

	public isValid(value: string, { entry }: SerializerUpdateContext): Awaited<boolean> {
		if (this.kRegExp.test(value)) {
			const snowflake = DiscordSnowflake.deconstruct(value);
			const timestamp = Number(snowflake.timestamp);
			if (timestamp >= this.kMinimum && timestamp < Date.now()) return true;
		}
		throw new UserError({ identifier: LanguageKeys.Serializers.InvalidSnowflake, context: { name: entry.name } });
	}
}
