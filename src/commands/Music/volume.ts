import { CommandStore, KlasaMessage } from 'klasa';
import { MusicCommand } from '../../lib/structures/MusicCommand';

export default class extends MusicCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['vol'],
			description: language => language.tget('COMMAND_VOLUME_DESCRIPTION'),
			music: ['SAME_VOICE_CHANNEL', 'VOICE_PLAYING'],
			usage: '[volume:number]'
		});
	}

	public async run(message: KlasaMessage, [volume]: [number]) {
		const { music } = message.guild!;
		const previousVolume = music.volume;

		// If no argument was given
		if (typeof volume === 'undefined' || volume === previousVolume) {
			return message.sendLocale('COMMAND_VOLUME_SUCCESS', [previousVolume]);
		}

		if (music.listeners.length >= 4 && !await music.manageableFor(message)) {
			throw message.language.tget('INHIBITOR_MUSIC_DJ_MEMBER');
		}

		// Set the volume
		await music.setVolume(volume);
		return message.sendLocale('COMMAND_VOLUME_CHANGED', [volume > previousVolume
			? (volume === 200 ? '📢' : '🔊')
			: (volume === 0 ? '🔇' : '🔉'),
		volume]);
	}

}
