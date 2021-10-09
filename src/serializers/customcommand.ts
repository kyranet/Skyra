import { parseAndValidate } from '#lib/customCommands';
import { CustomCommand, Serializer, SerializerUpdateContext } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ZeroWidthSpace } from '#utils/constants';
import type { Awaitable } from '@sapphire/utilities';

export class UserSerializer extends Serializer<CustomCommand> {
	public parse(_: Serializer.Args, { t }: SerializerUpdateContext) {
		return this.error(t(LanguageKeys.Serializers.Unsupported));
	}

	public isValid(value: CustomCommand, { t }: SerializerUpdateContext): Awaitable<boolean> {
		if (typeof value.id !== 'string') {
			throw new Error(t(LanguageKeys.Serializers.CustomCommands.InvalidId));
		}

		if (value.id.length > 50) {
			throw t(LanguageKeys.Commands.Tags.TagNameTooLong);
		}

		if (value.id.includes('`') || value.id.includes(ZeroWidthSpace)) {
			throw t(LanguageKeys.Commands.Tags.TagNameNotAllowed);
		}

		if (!Array.isArray(value.aliases) || value.aliases.some((alias) => typeof alias !== 'string')) {
			throw new Error(t(LanguageKeys.Serializers.CustomCommands.InvalidAliases));
		}

		if (typeof value.embed !== 'boolean') {
			throw new Error(t(LanguageKeys.Serializers.CustomCommands.InvalidEmbed));
		}

		if (typeof value.color !== 'number') {
			throw new Error(t(LanguageKeys.Serializers.CustomCommands.InvalidColor));
		}

		if (typeof value.content !== 'string') {
			throw new Error(t(LanguageKeys.Serializers.CustomCommands.InvalidContent));
		}

		// We will need to mutate this because the dashboard can't send Sentence instances:
		value.content = parseAndValidate(value.content);

		return true;
	}

	public stringify(value: CustomCommand): string {
		return value.id;
	}

	public equals(left: CustomCommand, right: CustomCommand): boolean {
		return left.id === right.id;
	}
}
