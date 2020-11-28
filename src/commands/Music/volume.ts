import { MusicCommand } from '#lib/structures/MusicCommand';
import { Events } from '#lib/types/Enums';
import { GuildMessage } from '#lib/types/index';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { requireMusicPlaying, requireSameVoiceChannel, requireSkyraInVoiceChannel, requireUserInVoiceChannel } from '#utils/Music/Decorators';
import { ApplyOptions } from '@skyra/decorators';

@ApplyOptions<MusicCommand.Options>({
	aliases: ['vol'],
	description: (language) => language.get(LanguageKeys.Commands.Music.VolumeDescription),
	usage: '[volume:number]'
})
export default class extends MusicCommand {
	@requireUserInVoiceChannel()
	@requireSkyraInVoiceChannel()
	@requireSameVoiceChannel()
	@requireMusicPlaying()
	public async run(message: GuildMessage, [volume]: [number]) {
		const { audio } = message.guild;
		const previous = await audio.getVolume();

		// If no argument was given
		if (typeof volume === 'undefined' || volume === previous) {
			return message.sendLocale(LanguageKeys.Commands.Music.VolumeSuccess, [{ volume: previous }]);
		}

		const channel = audio.voiceChannel!;
		if (channel.listeners.length >= 4 && !(await message.member.canManage(channel))) {
			throw await message.fetchLocale(LanguageKeys.Inhibitors.MusicDjMember);
		}

		// Set the volume
		await audio.setVolume(volume);
		return this.client.emit(Events.MusicSongVolumeUpdateNotify, message, previous, volume);
	}
}
