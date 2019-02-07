import { DiscordAPIError, HTTPError, MessageEmbed } from 'discord.js';
import { Language } from 'klasa';
import { FetchError } from 'node-fetch';
import { CLIENT_ID } from '../../../config';
import { Databases } from '../types/constants/Constants';
import { Events } from '../types/Enums';
import { TIME } from '../util/constants';
import { resolveEmoji } from '../util/util';
import { GiveawayManager } from './GiveawayManager';

export class Giveaway {

	public id: string;
	public endsAt: number;
	public refreshAt: number;
	public title: string;
	public minimum: number;
	public minimumWinners: number;
	public messageID: string;
	public channelID: string;
	public guildID: string;
	public finished = false;
	private winners: string[] = [];
	private paused = false;
	private rendering = false;

	public constructor(public store: GiveawayManager, data: GiveawayData) {
		this.id = data.id;
		this.title = data.title;
		this.endsAt = data.endsAt;
		this.channelID = data.channelID;
		this.guildID = data.guildID;
		this.messageID = data.messageID || null;
		this.minimum = data.minimum;
		this.minimumWinners = data.minimumWinners;
		this.refreshAt = this.calculateNextRefresh();
	}

	public get guild() {
		return this.store.client.guilds.get(this.guildID) || null;
	}

	public get language() {
		const guild = this.guild;
		return guild ? guild.language : null;
	}

	public get remaining() {
		return Math.max(this.endsAt - Date.now(), 0);
	}

	private get state() {
		const remaining = this.remaining;
		if (remaining <= 0) return States.Finished;
		if (remaining < TIME.SECOND * 20) return States.LastChance;
		return States.Running;
	}

	public async init() {
		this.pause();

		// Create the message
		const message = await (this.store.client as any).api.channels(this.channelID).messages.post({ data: await this.getData() });
		this.messageID = message.id;
		this.resume();

		// Add a reaction to the message and save to database
		await (this.store.client as any).api.channels(this.channelID).messages(this.messageID).reactions(Giveaway.EMOJI, '@me').put();
		await this.store.client.providers.default.create(Databases.Giveaway, this.id, this.toJSON());
		return this;
	}

	public async run() {
		await this.render();
	}

	public async render() {
		// TODO: Make a promise queue, if there are 1 or more pending edits
		// on heavy ratelimits, skip all of them and unshift the last edit

		// Skip early if it's already rendering
		if (this.paused || this.rendering) return this;
		this.rendering = true;

		try {
			await (this.store.client as any).api.channels(this.channelID).messages(this.messageID).patch({ data: await this.getData() });
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				// Unknown message
				if (error.code === 10008) {
					await this.destroy();
				} else {
					this.store.client.emit(Events.ApiError, error);
				}
			}
		}

		// Set self rendering to false
		this.rendering = false;
		return this;
	}

	public resume() {
		this.paused = false;
		return this;
	}

	public pause() {
		this.paused = true;
		return this;
	}

	public async finish() {
		this.finished = true;
		await this.store.client.providers.default.delete(Databases.Giveaway, this.id);
		return this;
	}

	public async destroy() {
		await this.finish();
		if (this.messageID) {
			try {
				await (this.store.client as any).api.channels(this.channelID).messages(this.messageID).delete();
			} catch (error) {
				if (error instanceof DiscordAPIError) {
					// Unknown message
					if (error.code !== 10008) this.store.client.emit(Events.ApiError, error);
				} else {
					this.store.client.emit(Events.Wtf, error);
				}
			}
		}
		return this;
	}

	public toJSON(): GiveawayData {
		return {
			channelID: this.channelID,
			endsAt: this.endsAt,
			guildID: this.guildID,
			id: this.id,
			messageID: this.messageID,
			minimum: this.minimum,
			minimumWinners: this.minimumWinners,
			title: this.title
		};
	}

	private async getData() {
		const language = this.language;
		const state = this.state;
		if (state === States.Finished) {
			this.winners = await this.pickWinners();
			await this.announceWinners(language);
			await this.finish();
		} else {
			this.refreshAt = this.calculateNextRefresh();
		}
		const content = this.getContent(state, language);
		const embed = await this.getEmbed(state, language);
		return { content, embed };
	}

	private async announceWinners(language: Language) {
		if (!this.winners.length) return;
		const content = language.get('GIVEAWAY_ENDED_MESSAGE', this.winners.map((winner) => `<@${winner}>`), this.title);
		try {
			await (this.store.client as any).api.channels(this.channelID).messages.post({ data: { content } });
		} catch (error) {
			this.store.client.emit(Events.ApiError, error);
		}
	}

	private async getEmbed(state: States, language: Language) {
		const description = await this.getDescription(state, language);
		const footer = this.getFooter(state, language);
		return new MessageEmbed()
			.setColor(this.getColor(state))
			.setTitle(this.title)
			.setDescription(description)
			.setFooter(footer)
			.setTimestamp(this.endsAt)
			// @ts-ignore
			._apiTransform();
	}

	private getContent(state: States, language: Language) {
		switch (state) {
			case States.Finished: return language.get('GIVEAWAY_ENDED_TITLE');
			case States.LastChance: return language.get('GIVEAWAY_LASTCHANCE_TITLE');
			default: return language.get('GIVEAWAY_TITLE');
		}
	}

	private async getDescription(state: States, language: Language) {
		switch (state) {
			case States.Finished: return this.winners && this.winners.length
				? language.get('GIVEAWAY_ENDED', await this.winners.map((winner) => `<@${winner}>`))
				: language.get('GIVEAWAY_ENDED_NO_WINNER');
			case States.LastChance: return language.get('GIVEAWAY_LASTCHANCE', this.remaining);
			default: return language.get('GIVEAWAY_DURATION', this.remaining);
		}
	}

	private getColor(state: States) {
		switch (state) {
			case States.Finished: return Colors.Red;
			case States.LastChance: return Colors.Orange;
			default: return Colors.Blue;
		}
	}

	private getFooter(state: States, language: Language) {
		return state === States.Running
			? language.get('GIVEAWAY_ENDS_AT')
			: language.get('GIVEAWAY_ENDED_AT');
	}

	private calculateNextRefresh() {
		const remaining = this.remaining;
		if (remaining < TIME.SECOND * 5) return Date.now() + TIME.SECOND;
		if (remaining < TIME.SECOND * 30) return Date.now() + Math.min(remaining - TIME.SECOND * 6, TIME.SECOND * 5);
		if (remaining < TIME.MINUTE * 2) return Date.now() + TIME.SECOND * 15;
		if (remaining < TIME.MINUTE * 5) return Date.now() + TIME.SECOND * 20;
		if (remaining < TIME.MINUTE * 15) return Date.now() + TIME.MINUTE;
		if (remaining < TIME.MINUTE * 30) return Date.now() + TIME.MINUTE * 2;
		return Date.now() + TIME.MINUTE * 5;
	}

	private async pickWinners() {
		const participants = await this.fetchParticipants();
		if (participants.length < this.minimum) return null;

		let m = participants.length;
		while (m) {
			const i = Math.floor(Math.random() * m--);
			[participants[m], participants[i]] = [participants[i], participants[m]];
		}
		return participants.slice(0, this.minimumWinners);
	}

	private async fetchParticipants() {
		const users: Set<string> = new Set();

		try {
			// Fetch loop, to get +100 users
			let buffer: any[];
			do {
				buffer = await (this.store.client as any).api.channels(this.channelID).messages(this.messageID).reactions(Giveaway.EMOJI)
					.get({ query: { limit: 100, after: buffer ? buffer[buffer.length - 1] : undefined } });
				for (const user of buffer) users.add(user.id);
			} while (buffer.length % 100 === 0);
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				// UNKNOWN_MESSAGE | UNKNOWN_EMOJI
				if (error.code === 10008 || error.code === 10014) return [];
			} else if (error instanceof HTTPError || error instanceof FetchError) {
				if (error.code === 'ECONNRESET') return this.fetchParticipants();
			}
			return [];
		}

		users.delete(CLIENT_ID);
		return [...users];
	}

	public static EMOJI = resolveEmoji(`🎉`);

}

export interface GiveawayCreateData {
	title: string;
	endsAt: number;
	guildID: string;
	channelID: string;
	minimum: number;
	minimumWinners: number;
}

export interface GiveawayData extends GiveawayCreateData {
	id: string;
	messageID: string;
}

enum States {
	Running,
	LastChance,
	Finished
}

enum Colors {
	Blue = 0x47C7F7,
	Orange = 0xFFA721,
	Red = 0xE80F2B
}
