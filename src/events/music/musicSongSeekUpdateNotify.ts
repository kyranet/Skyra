import { AudioEvent } from '#lib/structures/events/AudioEvent';
import { MessageAcknowledgeable } from '#lib/types';
import { LanguageKeys } from '#lib/i18n/languageKeys';

export default class extends AudioEvent {
	public async run(channel: MessageAcknowledgeable, time: number) {
		await channel.sendTranslated(LanguageKeys.Commands.Music.SeekSuccess, [{ time }]);
	}
}
