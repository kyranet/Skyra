import { Serializer, SerializerUpdateContext } from '@lib/database';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { Awaited } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { AliasPieceOptions } from 'klasa';

@ApplyOptions<AliasPieceOptions>({
	aliases: ['bool']
})
export default class UserSerializer extends Serializer<boolean> {
	private readonly kTruthyTerms = new Set(['true', 't', 'yes', 'y', 'on', 'enable', 'enabled', '1', '+']);
	private readonly kFalsyTerms = new Set(['false', 'f', 'no', 'n', 'off', 'disable', 'disabled', '0', '-']);

	public parse(value: string, context: SerializerUpdateContext): Awaited<boolean> {
		const boolean = value.toLowerCase();
		if (this.kTruthyTerms.has(boolean)) return true;
		if (this.kFalsyTerms.has(boolean)) return false;
		throw context.language.get(LanguageKeys.Resolvers.InvalidBool, { name: context.entry.name });
	}

	public isValid(value: boolean): Awaited<boolean> {
		return typeof value === 'boolean';
	}

	public stringify(data: boolean): string {
		return data ? 'Enabled' : 'Disabled';
	}
}
