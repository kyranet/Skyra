import { NotificationsStreamsTwitchStreamer, NotificationsStreamTwitch } from '@lib/types/settings/GuildSettings';
import { Serializer, SerializerUpdateContext } from 'klasa';

export default class extends Serializer {
	public validate(data: NotificationsStreamTwitch, { language }: SerializerUpdateContext) {
		// Validate that data is a tuple [string, x[]].
		if (!Array.isArray(data) || data.length !== 2 || typeof data[0] !== 'string' || !Array.isArray(data[1])) {
			return Promise.reject(language.get('SERIALIZER_TWITCH_SUBSCRIPTION_INVALID'));
		}

		// Validate that all entries from the second index in the tuple are indeed correct values.
		if (data[1].some((streamer) => !this.validateStreamer(streamer))) {
			return Promise.reject(language.get('SERIALIZER_TWITCH_SUBSCRIPTION_INVALID_STREAMER'));
		}

		// Return without further modifications
		return Promise.resolve(data);
	}

	public stringify(value: NotificationsStreamTwitch) {
		return value[0];
	}

	private validateStreamer(data: NotificationsStreamsTwitchStreamer) {
		return (
			typeof data.channel === 'string' &&
			typeof data.author === 'string' &&
			(typeof data.message === 'string' || data.message === null || data.message === undefined) &&
			typeof data.embed === 'boolean' &&
			typeof data.status === 'number' &&
			typeof data.createdAt === 'number' &&
			Array.isArray(data.gamesWhitelist) &&
			data.gamesWhitelist.every((game) => typeof game === 'string') &&
			Array.isArray(data.gamesBlacklist) &&
			data.gamesBlacklist.every((game) => typeof game === 'string')
		);
	}
}
