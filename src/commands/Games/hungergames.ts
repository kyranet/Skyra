import { HungerGamesUsage } from '#lib/games/HungerGamesUsage';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { minutes } from '#utils/common';
import { addReaction, deleteMessage, isModerator } from '#utils/functions';
import { LLRCData, LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { cleanMentions } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { canSendMessages } from '@sapphire/discord.js-utilities';
import { chunk, isFunction } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import type { TFunction } from 'i18next';
import { setTimeout as sleep } from 'timers/promises';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['hunger-games', 'hg'],
	description: LanguageKeys.Commands.Games.HungerGamesDescription,
	extendedHelp: LanguageKeys.Commands.Games.HungerGamesExtended,
	flags: ['autofill', 'autoskip'],
	requiredClientPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	public readonly playing: Set<string> = new Set();
	public readonly kEmojis = ['🇳', '🇾'];

	public async run(message: GuildMessage, args: SkyraCommand.Args, context: SkyraCommand.Context) {
		const autoFilled = args.getFlags('autofill');
		const tributes = args.finished && autoFilled ? [] : args.nextSplit({ times: 50 });
		const autoSkip = args.getFlags('autoskip');

		if (autoFilled) {
			const messages = await message.channel.messages.fetch({ limit: 100 });

			for (const { author } of messages.values()) {
				if (author && !tributes.includes(author.username)) tributes.push(author.username);
			}
		} else if (tributes.length === 0) {
			this.error(LanguageKeys.Commands.Games.GamesNoPlayers, { prefix: context.commandPrefix });
		}

		const filtered = new Set(tributes);
		if (filtered.size !== tributes.length) this.error(LanguageKeys.Commands.Games.GamesRepeat);
		if (this.playing.has(message.channel.id)) this.error(LanguageKeys.Commands.Games.GamesProgress);
		if (filtered.size < 4 || filtered.size > 48) this.error(LanguageKeys.Commands.Games.GamesTooManyOrFew, { min: 4, max: 48 });
		this.playing.add(message.channel.id);

		let resolve: ((value: boolean) => void) | null = null;
		let gameMessage: GuildMessage | null = null;
		const game: HungerGamesGame = Object.seal({
			bloodbath: true,
			llrc: new LongLivingReactionCollector(
				async (reaction) => {
					// Ignore if resolve is not ready
					if (
						!isFunction(resolve) ||
						// Run the collector inhibitor
						(await this.collectorInhibitor(message, gameMessage!, reaction))
					)
						return;
					resolve(Boolean(this.kEmojis.indexOf(reaction.emoji.id ?? reaction.emoji.name!)));
					resolve = null;
				},
				() => {
					if (isFunction(resolve)) resolve(false);
					this.playing.delete(message.channel.id);
				}
			),
			sun: true,
			tributes: this.shuffle([...filtered].map(cleanMentions.bind(null, message.guild))),
			turn: 0
		});

		try {
			while (game.tributes.size > 1) {
				// If it's not bloodbath and it became the day, increase the turn
				if (!game.bloodbath && game.sun) ++game.turn;
				const events = game.bloodbath
					? LanguageKeys.Commands.Games.HungerGamesBloodbath
					: game.sun
					? LanguageKeys.Commands.Games.HungerGamesDay
					: LanguageKeys.Commands.Games.HungerGamesNight;

				// Main logic of the game
				const { results, deaths } = this.makeResultEvents(game, args.t(events).map(HungerGamesUsage.create));
				const texts = this.buildTexts(args.t, game, results, deaths);

				// Ask for the user to proceed:
				for (const text of texts) {
					// If the we can not longer send messages to the channel, break:
					if (!canSendMessages(message.channel)) return;

					// Refresh the LLRC's timer, send new message with new reactions:
					game.llrc.setTime(minutes(2));
					gameMessage = (await message.channel.send(text)) as GuildMessage;
					for (const emoji of ['🇾', '🇳']) {
						await addReaction(gameMessage, emoji);
					}

					// Ask for verification.
					// NOTE: This does not deadlock because the callback is assigned to a variable in the scope, which
					// is called with `false` when the LLRC times out.
					const verification = await new Promise<boolean>(async (res) => {
						resolve = res;
						if (autoSkip) {
							await sleep((gameMessage!.content.length / 20) * 1000);
							res(true);
						}
					});

					// Delete the previous message, and if stopped, send stop.
					await deleteMessage(gameMessage);
					if (!verification) {
						if (canSendMessages(message.channel)) {
							const content = args.t(LanguageKeys.Commands.Games.HungerGamesStop);
							await send(message, content);
						}
						return;
					}
				}
				if (game.bloodbath) game.bloodbath = false;
				else game.sun = !game.sun;
			}

			// The match finished with one remaining player
			const content = args.t(LanguageKeys.Commands.Games.HungerGamesWinner, { winner: game.tributes.values().next().value as string });
			await send(message, content);
		} catch (error) {
			throw error;
		} finally {
			game.llrc.end();
		}
	}

	private async collectorInhibitor(message: GuildMessage, gameMessage: GuildMessage, reaction: LLRCData) {
		// If there's no gameMessage, inhibit
		if (!gameMessage) return true;

		// If the message reacted is not the game's, inhibit
		if (reaction.messageId !== gameMessage.id) return true;

		// If the emoji reacted is not valid, inhibit
		if (!this.kEmojis.includes(reaction.emoji.id ?? reaction.emoji.name!)) return true;

		// If the user who reacted is the author, don't inhibit
		if (reaction.userId === message.author.id) return false;

		// Don't listen to herself
		if (reaction.userId === process.env.CLIENT_ID) return true;

		try {
			// Fetch the member for level measuring purposes
			const member = await message.guild.members.fetch(reaction.userId);
			// Check if the user is a moderator
			return !(await isModerator(member));
		} catch {
			return true;
		}
	}

	private buildTexts(t: TFunction, game: HungerGamesGame, results: string[], deaths: string[]) {
		const headerKey = game.bloodbath
			? LanguageKeys.Commands.Games.HungerGamesResultHeaderBloodbath
			: game.sun
			? LanguageKeys.Commands.Games.HungerGamesResultHeaderSun
			: LanguageKeys.Commands.Games.HungerGamesResultHeaderMoon;

		const header = t(headerKey, { game });
		const death = deaths.length
			? `${t(LanguageKeys.Commands.Games.HungerGamesResultDeaths, { count: deaths.length })}\n\n${deaths.map((d) => `- ${d}`).join('\n')}`
			: '';
		const proceed = t(LanguageKeys.Commands.Games.HungerGamesResultProceed);
		const panels = chunk(results, 5);

		const texts = panels.map((panel) => `__**${header}:**__\n\n${panel.map((text) => `- ${text}`).join('\n')}\n\n_${proceed}_`) as string[];
		if (deaths.length) texts.push(`${death}\n\n_${proceed}_`);
		return texts;
	}

	private pick(events: readonly HungerGamesUsage[], tributes: number, maxDeaths: number) {
		events = events.filter((event) => event.tributes <= tributes && event.deaths.size <= maxDeaths);
		return events[Math.floor(Math.random() * events.length)];
	}

	private pickTributes(tribute: string, turn: Set<string>, amount: number) {
		if (amount === 0) return [];
		if (amount === 1) return [tribute];
		const array = [...turn];
		array.splice(array.indexOf(tribute), 1);

		let m = array.length;
		while (m) {
			const i = Math.floor(Math.random() * m--);
			[array[m], array[i]] = [array[i], array[m]];
		}
		array.unshift(tribute);
		return array.slice(0, amount);
	}

	private makeResultEvents(game: HungerGamesGame, events: readonly HungerGamesUsage[]) {
		const results = [] as string[];
		const deaths = [] as string[];
		let maxDeaths = this.calculateMaxDeaths(game);

		const turn = new Set([...game.tributes]);
		for (const tribute of game.tributes) {
			// If the player already had its turn, skip
			if (!turn.has(tribute)) continue;

			// Pick a valid event
			const event = this.pick(events, turn.size, maxDeaths);

			// Pick the tributes
			const pickedTributes = this.pickTributes(tribute, turn, event.tributes);

			// Delete all the picked tributes from this round
			for (const picked of pickedTributes) {
				turn.delete(picked);
			}

			// Kill all the unfortunate tributes
			for (const death of event.deaths) {
				game.tributes.delete(pickedTributes[death]);
				deaths.push(pickedTributes[death]);
				maxDeaths--;
			}

			// Push the result of this match
			results.push(event.display(...pickedTributes));
		}

		return { results, deaths };
	}

	private shuffle(tributes: string[]) {
		let m = tributes.length;
		while (m) {
			const i = Math.floor(Math.random() * m--);
			[tributes[m], tributes[i]] = [tributes[i], tributes[m]];
		}
		return new Set(tributes);
	}

	private calculateMaxDeaths(game: HungerGamesGame) {
		// If there are more than 16 tributes, perform a large blood bath
		return game.tributes.size >= 16
			? // For 16 people, 4 die, 36 -> 6, and so on keeps the game interesting.
			  // If it's in bloodbath, perform 50% more deaths.
			  Math.ceil(Math.sqrt(game.tributes.size) * (game.bloodbath ? 1.5 : 1))
			: // If there are more than 7 tributes, proceed to kill them in 4 or more.
			game.tributes.size > 7
			? // If it's a bloodbath, perform mass death (12 -> 7), else eliminate 4.
			  game.bloodbath
				? Math.ceil(Math.min(game.tributes.size - 3, Math.sqrt(game.tributes.size) * 2))
				: 4
			: // If there are 4 tributes, eliminate 2, else 1 (3 -> 2, 2 -> 1)
			game.tributes.size === 4
			? 2
			: 1;
	}
}

export interface HungerGamesGame {
	bloodbath: boolean;
	llrc: LongLivingReactionCollector;
	sun: boolean;
	tributes: Set<string>;
	turn: number;
}
