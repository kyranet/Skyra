import { Queue } from '@lib/audio';
import { DbSet } from '@lib/structures/DbSet';
import { MusicCommand } from '@lib/structures/MusicCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { GuildMessage } from '@lib/types/Discord';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { chunk } from '@sapphire/utilities';
import { TrackInfo } from '@skyra/audio';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, ZeroWidthSpace } from '@utils/constants';
import { requireQueueNotEmpty } from '@utils/Music/Decorators';
import { pickRandom, showSeconds } from '@utils/util';
import { MessageEmbed } from 'discord.js';

@ApplyOptions<MusicCommand.Options>({
	aliases: ['q', 'playing-time', 'pt'],
	description: (language) => language.get(LanguageKeys.Commands.Music.QueueDescription),
	requiredPermissions: ['ADD_REACTIONS', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'READ_MESSAGE_HISTORY']
})
export default class extends MusicCommand {
	@requireQueueNotEmpty()
	public async run(message: GuildMessage) {
		// Send the loading message
		const response = await message.send(
			new MessageEmbed().setColor(BrandingColors.Secondary).setDescription(pickRandom(message.language.get(LanguageKeys.System.Loading)))
		);

		// Generate the pages with 5 songs each
		const queueDisplay = new UserRichDisplay(
			new MessageEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setTitle(message.language.get(LanguageKeys.Commands.Music.QueueTitle, { guildname: message.guild.name }))
		);

		const { audio } = message.guild;
		const current = await audio.nowPlaying();
		const tracks = await this.getTrackInformation(audio);

		if (current) {
			const track = current.entry.info;
			const nowPlayingDescription = [
				track.isStream ? message.language.get(LanguageKeys.Commands.Music.QueueNowplayingLiveStream) : showSeconds(track.length),
				message.language.get(LanguageKeys.Commands.Music.QueueNowplaying, {
					title: track.title,
					url: track.uri,
					requester: await this.fetchRequesterName(message, current.entry.author)
				})
			];

			if (!track.isStream) {
				nowPlayingDescription.push(
					message.language.get(LanguageKeys.Commands.Music.QueueNowplayingTimeRemaining, {
						timeRemaining: showSeconds(track.length - current.position)
					})
				);
			}

			queueDisplay.embedTemplate.addField(
				message.language.get(LanguageKeys.Commands.Music.QueueNowplayingTitle),
				nowPlayingDescription.join(' | ')
			);
		}

		if (tracks.length) {
			// Format the song entries
			const songFields = await Promise.all(tracks.map((track, position) => this.generateTrackField(message, position, track)));
			const totalDuration = this.calculateTotalDuration(tracks);
			const totalDescription = message.language.get(LanguageKeys.Commands.Music.QueueTotal, {
				songs: message.language.get(
					tracks.length === 1 ? LanguageKeys.Commands.Music.AddPlaylistSongs : LanguageKeys.Commands.Music.AddPlaylistSongsPlural,
					{
						count: tracks.length
					}
				),
				remainingTime: showSeconds(totalDuration)
			});

			queueDisplay.embedTemplate.addField(message.language.get(LanguageKeys.Commands.Music.QueueTotalTitle), totalDescription);
			queueDisplay.embedTemplate.addField(
				ZeroWidthSpace,
				message.language.get(LanguageKeys.Commands.Music.QueueDashboardInfo, { guild: message.guild! })
			);

			for (const page of chunk(songFields, 5)) {
				queueDisplay.addPage((embed: MessageEmbed) => embed.setDescription(page.join('\n\n')));
			}
		}

		if (queueDisplay.pages.length) {
			// Run the display
			await queueDisplay.start(response, message.author.id);
			return response;
		}

		// Just send the template as a regular embed as there are no pages to display
		return response.edit(undefined, queueDisplay.template);
	}

	private async generateTrackField(message: GuildMessage, position: number, entry: DecodedQueueEntry) {
		const username = await this.fetchRequesterName(message, entry.author);
		return message.language.get(LanguageKeys.Commands.Music.QueueLine, {
			position: position + 1,
			duration: showSeconds(entry.data.length),
			title: entry.data.title,
			url: entry.data.uri,
			requester: username
		});
	}

	private calculateTotalDuration(entries: readonly DecodedQueueEntry[]) {
		let accumulator = 0;
		for (const entry of entries) {
			if (entry.data.isStream) return -1;
			accumulator += entry.data.length;
		}

		return accumulator;
	}

	private async fetchRequesterName(message: GuildMessage, userID: string): Promise<string> {
		try {
			return (await message.guild.members.fetch(userID)).displayName;
		} catch {}

		try {
			return (await this.client.users.fetch(userID)).username;
		} catch {}

		return message.language.get(LanguageKeys.Misc.UnknownUser);
	}

	private async getTrackInformation(audio: Queue): Promise<readonly DecodedQueueEntry[]> {
		const tracks = await audio.tracks();
		const decodedTracks = await audio.player.node.decode(tracks.map((track) => track.track));

		const map = new Map<string, TrackInfo>();
		for (const entry of decodedTracks) {
			map.set(entry.track, entry.info);
		}

		return tracks.map((track) => ({ author: track.author, data: map.get(track.track)! }));
	}
}

interface DecodedQueueEntry {
	author: string;
	data: TrackInfo;
}
