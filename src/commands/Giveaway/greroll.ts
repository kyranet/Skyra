import { DiscordAPIError, HTTPError, Message } from 'discord.js';
import { CommandOptions, KlasaMessage } from 'klasa';
import { FetchError } from 'node-fetch';
import { CLIENT_ID } from '../../../config';
import { Colors, Giveaway, GiveawayEmoji } from '../../lib/structures/Giveaway';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { Events } from '../../lib/types/Enums';
import { ApplyOptions, fetchReactionUsers } from '../../lib/util/util';

@ApplyOptions<CommandOptions>({
	aliases: ['gr'],
	description: language => language.tget('COMMAND_GIVEAWAYREROLL_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_GIVEAWAYREROLL_EXTENDED'),
	requiredPermissions: ['READ_MESSAGE_HISTORY'],
	runIn: ['text'],
	usage: '[winners:number{1,100}] [message:message]',
	usageDelim: ' '
})
export default class extends SkyraCommand {

	public async run(message: KlasaMessage, [winnerAmount = 1, rawTarget]: [number, KlasaMessage | undefined]) {
		const target = await this.resolveMessage(message, rawTarget);
		const { title } = target.embeds[0];
		const winners = await this.pickWinners(target, winnerAmount);
		const content = winners
			? message.language.tget('GIVEAWAY_ENDED_MESSAGE', winners.map(winner => `<@${winner}>`), title)
			: message.language.tget('GIVEAWAY_ENDED_MESSAGE_NO_WINNER', title);
		return message.sendMessage(content);
	}

	private async resolveMessage(message: KlasaMessage, rawTarget: KlasaMessage | undefined) {
		const target = rawTarget
			? this.validateMessage(rawTarget) ? rawTarget : null
			: (await message.channel.messages.fetch({ limit: 100 })).find(msg => this.validateMessage(msg)) || null;
		if (target) return target as KlasaMessage;
		throw message.language.tget('COMMAND_GIVEAWAYREROLL_INVALID');
	}

	private async pickWinners(message: KlasaMessage, winnerAmount: number) {
		const participants = await this.fetchParticipants(message);
		if (participants.length < winnerAmount) return null;

		let m = participants.length;
		while (m) {
			const i = Math.floor(Math.random() * m--);
			[participants[m], participants[i]] = [participants[i], participants[m]];
		}
		return participants.slice(0, winnerAmount);
	}

	private async fetchParticipants(message: KlasaMessage): Promise<string[]> {
		try {
			const users = await fetchReactionUsers(message.client, message.channel.id, message.id, Giveaway.EMOJI);
			users.delete(CLIENT_ID);
			return [...users];
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				// UNKNOWN_MESSAGE | UNKNOWN_EMOJI
				if (error.code === 10008 || error.code === 10014) return [];
			} else if (error instanceof HTTPError || error instanceof FetchError) {
				if (error.code === 'ECONNRESET') return this.fetchParticipants(message);
				this.store.client.emit(Events.ApiError, error);
			}
			return [];
		}
	}

	private validateMessage(message: Message) {
		return message.author !== null
			&& message.author.id === CLIENT_ID
			&& message.embeds.length === 1
			&& message.embeds[0].color === Colors.Red
			&& message.reactions.has(GiveawayEmoji);
	}

}
