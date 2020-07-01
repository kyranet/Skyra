import { escapeMarkdown } from '@utils/External/escapeMarkdown';
import { flattenSong } from '@utils/Models/ApiTransform';
import { cleanMentions, enumerable, showSeconds } from '@utils/util';
import { TrackData } from 'lavacord';
import { MusicHandler } from './MusicHandler';

export class Song {

	@enumerable(false)
	public id: string;

	@enumerable(false)
	public track: string;

	@enumerable(false)
	public requester: string;

	@enumerable(false)
	public queue: MusicHandler;

	public identifier: string;
	public seekable: boolean;
	public author: string;
	public duration: number;
	public stream: boolean;
	public position: number;
	public title: string;
	public url: string;
	public skips = new Set<string>();

	/**
	 * @param queue The queue that manages this song.
	 * @param data The retrieved data.
	 * @param requester The user ID that requested this song.
	 */
	public constructor(queue: MusicHandler, data: TrackData, requester: string) {
		this.id = Song.generateID(requester);
		this.queue = queue;
		this.track = data.track;
		this.requester = requester;
		this.identifier = data.info.identifier;
		this.seekable = data.info.isSeekable;
		this.author = data.info.author;
		this.duration = data.info.length;
		this.stream = data.info.isStream;
		this.position = data.info.position;
		this.title = data.info.title;
		this.url = data.info.uri;
	}

	/**
	 * The cleaned and escaped title
	 */
	public get safeTitle() {
		return cleanMentions(this.queue.guild, escapeMarkdown(this.title));
	}

	public get friendlyDuration(): string {
		return showSeconds(this.duration);
	}

	public async fetchRequesterName() {
		const nickname = await this.queue.guild.memberTags.fetch(this.requester)
			.then(member => member?.nickname)
			.catch(() => null);
		const display = nickname ?? await this.queue.client.userTags.fetch(this.requester)
			.then(user => user.username)
			.catch(() => this.queue.guild.language.tget('UNKNOWN_USER'));
		return escapeMarkdown(cleanMentions(this.queue.guild, display));
	}

	public toString(): string {
		return `<${this.url}>`;
	}

	public toJSON() {
		return flattenSong(this);
	}

	private static counter = 0;

	private static generateID(author: string) {
		if (++Song.counter === 0xFFFFFF) Song.counter = 0;
		return Buffer.from(`${author}.${Song.counter}.${Date.now()}`).toString('base64');
	}

}
