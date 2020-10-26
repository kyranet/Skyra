import { MusicCommand } from '@lib/structures/MusicCommand';
import { GuildMessage } from '@lib/types/Discord';
import { Events } from '@lib/types/Enums';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';
import { requireMusicPaused, requireSameVoiceChannel, requireSkyraInVoiceChannel, requireUserInVoiceChannel } from '@utils/Music/Decorators';

@ApplyOptions<MusicCommand.Options>({
	description: (language) => language.get(LanguageKeys.Commands.Music.ResumeDescription)
})
export default class extends MusicCommand {
	@requireUserInVoiceChannel()
	@requireSkyraInVoiceChannel()
	@requireSameVoiceChannel()
	@requireMusicPaused()
	public async run(message: GuildMessage) {
		await message.guild.audio.resume();
		this.client.emit(Events.MusicSongResumeNotify, message);
	}
}
