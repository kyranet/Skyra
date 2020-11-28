import { Serializer, SerializerUpdateContext } from '#lib/database/index';
import { Awaited } from '@sapphire/utilities';

export default class UserSerializer extends Serializer<string> {
	public parse(value: string, context: SerializerUpdateContext) {
		return this.minOrMax(value, value.length, context);
	}

	public isValid(value: string, context: SerializerUpdateContext): Awaited<boolean> {
		return this.minOrMax(value, value.length, context).success;
	}
}
