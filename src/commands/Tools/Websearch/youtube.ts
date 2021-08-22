import { envIsDefined } from '#lib/env';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { addReaction } from '#utils/functions';
import { LLRCData, LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildTextBasedChannelTypes } from '@sapphire/discord.js-utilities';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { Time } from '@sapphire/time-utilities';
import { send } from '@skyra/editable-commands';
import { Message, Permissions } from 'discord.js';
import { URL } from 'url';

const kPermissions = new Permissions([Permissions.FLAGS.ADD_REACTIONS, Permissions.FLAGS.MANAGE_MESSAGES]).freeze();

const EMOJIS = {
	previous: '⬅️',
	stop: '⏹️',
	next: '➡️'
};

@ApplyOptions<SkyraCommand.Options>({
	enabled: envIsDefined('GOOGLE_API_TOKEN'),
	aliases: ['yt'],
	description: LanguageKeys.Commands.Tools.YouTubeDescription,
	extendedHelp: LanguageKeys.Commands.Tools.YouTubeExtended
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const input = await args.rest('string');
		const url = new URL('https://youtube.googleapis.com/youtube/v3/search');
		url.searchParams.append('part', 'snippet');
		url.searchParams.append('safeSearch', 'strict');
		url.searchParams.append('q', input);
		url.searchParams.append('key', process.env.GOOGLE_API_TOKEN);

		const data = await fetch<YouTubeResultOk>(url, FetchResultTypes.JSON);
		const results = data.items.slice(0, 5);

		if (!results.length) this.error(LanguageKeys.Commands.Tools.YouTubeNotFound);

		const sent = await send(message, this.getLink(results[0]));

		// if Skyra doesn't have permissions for an LLRC, we fallback to the first link
		if (!message.guild?.me?.permissionsIn(message.channel as GuildTextBasedChannelTypes).has(kPermissions)) return;

		for (const emoji of Object.values(EMOJIS)) await addReaction(sent, emoji);

		let index = 0;
		const llrc = new LongLivingReactionCollector();

		llrc.setListener(async (reaction: LLRCData) => {
			if (reaction.messageId !== sent.id || reaction.userId !== message.author.id) return;

			switch (reaction.emoji.name) {
				case EMOJIS.next:
					index++;
					if (index >= results.length) return;
					if (index === results.length - 1) {
						// at the final page, remove the next emoji
						await sent.reactions.cache.get(EMOJIS.next)?.remove();
					}

					// add the previous emoji to go back
					if (!sent.reactions.cache.has(EMOJIS.previous)) {
						// remove all reactions to preserve the order: previous, stop, next
						await sent.reactions.removeAll();
						for (const emoji of Object.values(EMOJIS)) await addReaction(sent, emoji);
					}
					await sent.edit(this.getLink(results[index]));
					await sent.reactions.cache.get(EMOJIS.next)?.users.remove(reaction.userId);
					break;

				case EMOJIS.previous:
					index--;
					if (index < 0) return;
					if (index === 0) {
						// at the first page, remove the previous emoji
						await sent.reactions.cache.get(EMOJIS.previous)?.remove();
					}

					if (!sent.reactions.cache.has(EMOJIS.next)) await addReaction(sent, EMOJIS.next);
					await sent.edit(this.getLink(results[index]));
					await sent.reactions.cache.get(EMOJIS.previous)?.users.remove(reaction.userId);
					break;

				case EMOJIS.stop:
					await sent.reactions.removeAll();
					llrc.end();
			}
		});

		llrc.setEndListener(async () => {
			await sent.reactions.removeAll();
		});

		llrc.setTime(Time.Minute);
	}

	private getLink(result: YouTubeResultOkItem) {
		let output = '';
		switch (result.id.kind) {
			case 'youtube#channel':
				output = `https://youtube.com/channel/${result.id.channelId}`;
				break;
			case 'youtube#playlist':
				output = `https://www.youtube.com/playlist?list=${result.id.playlistId}`;
				break;
			case 'youtube#video':
				output = `https://youtu.be/${result.id.videoId}`;
				break;
			default: {
				this.container.logger.fatal(`YouTube -> Returned incompatible kind '${result.id.kind}'.`);
				throw 'I found an incompatible kind of result...';
			}
		}

		return output;
	}
}

export interface YouTubeResultOk {
	kind: string;
	etag: string;
	nextPageToken: string;
	regionCode: string;
	pageInfo: YouTubeResultOkPageInfo;
	items: YouTubeResultOkItem[];
}

export interface YouTubeResultOkItem {
	kind: string;
	etag: string;
	id: YouTubeResultOkId;
	snippet: YouTubeResultOkSnippet;
}

export interface YouTubeResultOkId {
	kind: string;
	playlistId?: string;
	channelId?: string;
	videoId?: string;
}

export interface YouTubeResultOkSnippet {
	publishedAt: Date;
	channelId: string;
	title: string;
	description: string;
	thumbnails: YouTubeResultOkThumbnails;
	channelTitle: string;
	liveBroadcastContent: string;
}

export interface YouTubeResultOkThumbnails {
	default: YouTubeResultOkThumbnail;
	medium: YouTubeResultOkThumbnail;
	high: YouTubeResultOkThumbnail;
}

export interface YouTubeResultOkThumbnail {
	url: string;
	width: number;
	height: number;
}

export interface YouTubeResultOkPageInfo {
	totalResults: number;
	resultsPerPage: number;
}
