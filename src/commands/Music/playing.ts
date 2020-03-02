import { MusicCommand } from '@lib/structures/MusicCommand';
import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends MusicCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['np', 'nowplaying'],
			description: language => language.tget('COMMAND_PLAYING_DESCRIPTION'),
			music: ['QUEUE_NOT_EMPTY', 'VOICE_PLAYING'],
			requiredPermissions: ['EMBED_LINKS']
		});
	}

	public async run(message: KlasaMessage) {
		const queue = message.guild!.music;
		const song = queue.song || (queue.queue.length ? queue.queue[0] : null);
		if (!song) throw message.language.tget('COMMAND_PLAYING_QUEUE_EMPTY');
		if (!queue.playing) throw message.language.tget('COMMAND_PLAYING_QUEUE_NOT_PLAYING');

		return message.sendMessage(new MessageEmbed()
			.setColor(12916736)
			.setTitle(song.title)
			.setURL(song.url)
			.setAuthor(song.author)
			.setDescription(message.language.tget('COMMAND_PLAYING_DURATION', song.friendlyDuration))
			.setTimestamp());
	}

}
