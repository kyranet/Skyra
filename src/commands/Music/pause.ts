import { MusicCommand, MusicCommandOptions } from '@lib/structures/MusicCommand';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';
import {
	requireDj,
	requireMusicPlaying,
	requireSameVoiceChannel,
	requireSkyraInVoiceChannel,
	requireUserInVoiceChannel
} from '@utils/Music/Decorators';
import { KlasaMessage } from 'klasa';

@ApplyOptions<MusicCommandOptions>({
	description: (language) => language.get(LanguageKeys.Commands.Music.PauseDescription)
})
export default class extends MusicCommand {
	@requireUserInVoiceChannel()
	@requireSkyraInVoiceChannel()
	@requireSameVoiceChannel()
	@requireDj()
	@requireMusicPlaying()
	public async run(message: KlasaMessage) {
		await message.guild!.audio.pause();
	}
}
