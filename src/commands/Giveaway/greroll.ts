import { kRawEmoji } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { Colors } from '#lib/types/Constants';
import { Events } from '#lib/types/Enums';
import { cast, fetchReactionUsers, resolveEmoji } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import { DiscordAPIError, HTTPError, Message } from 'discord.js';
import { FetchError } from 'node-fetch';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['gr', 'groll'],
	description: LanguageKeys.Commands.Giveaway.GiveawayRerollDescription,
	extendedHelp: LanguageKeys.Commands.Giveaway.GiveawayRerollExtended,
	requiredClientPermissions: ['READ_MESSAGE_HISTORY'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	// eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
	#kResolvedEmoji = resolveEmoji(kRawEmoji)!;

	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const winnerAmount = await args.pick('integer').catch(() => 1);
		const rawTarget = args.finished ? undefined : cast<GuildMessage>(await args.pick('message'));
		const target = await this.resolveMessage(message, rawTarget);
		const { title } = target.embeds[0];
		const winners = await this.pickWinners(target, winnerAmount);
		const content = winners
			? args.t(LanguageKeys.Giveaway.EndedMessage, { winners: winners.map((winner) => `<@!${winner}>`), title: title! })
			: args.t(LanguageKeys.Giveaway.EndedMessageNoWinner, { title: title! });
		return send(message, { content, allowedMentions: { users: [...new Set([message.author.id, ...(winners || [])])], roles: [] } });
	}

	private async resolveMessage(message: GuildMessage, rawTarget: GuildMessage | undefined) {
		const target = rawTarget
			? // If rawMessage is defined then we check everything sans the colour
			  this.validateMessage(rawTarget)
				? rawTarget
				: null
			: // If rawTarget was undefined then we fetch it from the API and we check embed colour
			  (await message.channel.messages.fetch({ limit: 100 })).find((msg) => this.validatePossibleMessage(msg)) || null;
		if (target) return target as GuildMessage;
		this.error(LanguageKeys.Commands.Giveaway.GiveawayRerollInvalid);
	}

	private async pickWinners(message: GuildMessage, winnerAmount: number) {
		const participants = await this.fetchParticipants(message);
		if (participants.length < winnerAmount) return null;

		let m = participants.length;
		while (m) {
			const i = Math.floor(Math.random() * m--);
			[participants[m], participants[i]] = [participants[i], participants[m]];
		}
		return participants.slice(0, winnerAmount);
	}

	private async fetchParticipants(message: GuildMessage): Promise<string[]> {
		try {
			const users = await fetchReactionUsers(message.channel.id, message.id, this.#kResolvedEmoji);
			users.delete(process.env.CLIENT_ID);
			return [...users];
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				if (error.code === RESTJSONErrorCodes.UnknownMessage || error.code === RESTJSONErrorCodes.UnknownEmoji) return [];
			} else if (error instanceof HTTPError || error instanceof FetchError) {
				if (error.code === 'ECONNRESET') return this.fetchParticipants(message);
				this.container.client.emit(Events.Error, error);
			}
			return [];
		}
	}

	/**
	 * Validates that this message is a message from Skyra and is a giveaway
	 */
	private validateMessage(message: Message) {
		return (
			message.author !== null &&
			message.author.id === process.env.CLIENT_ID &&
			message.embeds.length === 1 &&
			message.reactions.cache.has(kRawEmoji)
		);
	}

	/**
	 * Validates that this is a Skyra giveaway and that it has ended
	 */
	private validatePossibleMessage(message: Message) {
		return this.validateMessage(message) && message.embeds[0].color === Colors.Red;
	}
}
