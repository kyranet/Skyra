import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { Serializer, SerializerUpdateContext } from 'klasa';

export default class extends Serializer {
	private readonly kProtocol = /^https?:\/\//;

	public validate(data: string, { entry, language }: SerializerUpdateContext) {
		try {
			const { hostname } = new URL(this.kProtocol.test(data) ? data : `https://${data}`);
			return hostname.length > 128
				? Promise.reject(language.get(LanguageKeys.Resolvers.MinmaxMaxInclusive, { name: entry.path, max: 128 }))
				: Promise.resolve(hostname);
		} catch {
			return Promise.reject(language.get(LanguageKeys.Resolvers.InvalidUrl, { name: entry.path }));
		}
	}

	public stringify(data: string) {
		return `https://${data}`;
	}
}
