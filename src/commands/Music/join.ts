import { Queue } from '@lib/audio';
import { MusicCommand, MusicCommandOptions } from '@lib/structures/MusicCommand';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';
import { requireUserInVoiceChannel } from '@utils/Music/Decorators';
import { Permissions, VoiceChannel } from 'discord.js';
import { KlasaMessage } from 'klasa';
const { FLAGS } = Permissions;

@ApplyOptions<MusicCommandOptions>({
	aliases: ['connect'],
	description: (language) => language.get(LanguageKeys.Commands.Music.JoinDescription)
})
export default class extends MusicCommand {
	@requireUserInVoiceChannel()
	public async run(message: KlasaMessage) {
		// Get the voice channel the member is in
		const { channel } = message.member!.voice;

		// If the member is not in a voice channel then throw
		if (!channel) throw message.language.get(LanguageKeys.Commands.Music.JoinNoVoicechannel);

		const { audio } = message.guild!;

		// Check if the bot is already playing in this guild
		this.checkSkyraPlaying(message, audio, channel);

		// Ensure Skyra has the correct permissions to play music
		this.resolvePermissions(message, channel);

		// Set the ChannelID to the current channel
		await audio.textChannel(message.channel.id);

		// Connect to Lavalink and join the voice channel
		await audio.connect(channel.id);
	}

	private resolvePermissions(message: KlasaMessage, voiceChannel: VoiceChannel): void {
		const permissions = voiceChannel.permissionsFor(message.guild!.me!)!;

		// Administrators can join voice channels even if they are full
		if (voiceChannel.full && !permissions.has(FLAGS.ADMINISTRATOR)) throw message.language.get(LanguageKeys.Commands.Music.JoinVoiceFull);
		if (!permissions.has(FLAGS.CONNECT)) throw message.language.get(LanguageKeys.Commands.Music.JoinVoiceNoConnect);
		if (!permissions.has(FLAGS.SPEAK)) throw message.language.get(LanguageKeys.Commands.Music.JoinVoiceNoSpeak);
	}

	private checkSkyraPlaying(message: KlasaMessage, audio: Queue, voiceChannel: VoiceChannel) {
		const selfVoiceChannel = audio.player.playing ? this.getSelfVoiceChannelID(audio) : null;
		if (selfVoiceChannel === null) return;

		throw message.language.get(
			voiceChannel.id === selfVoiceChannel ? LanguageKeys.Commands.Music.JoinVoiceSame : LanguageKeys.Commands.Music.JoinVoiceDifferent
		);
	}

	private getSelfVoiceChannelID(audio: Queue): string | null {
		return audio.player.voiceState?.channel_id ?? null;
	}
}
