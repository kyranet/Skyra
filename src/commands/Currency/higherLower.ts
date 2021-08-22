import type { UserEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { minutes } from '#utils/common';
import { addReaction } from '#utils/functions';
import { LLRCData, LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { resolveEmoji } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@skyra/editable-commands';
import { MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

const enum HigherLowerReactions {
	Higher = 'a:sarrow_up:658450971655012363',
	Lower = 'a:sarrow_down:658452292558913536',
	Cancel = ':redCross:637706251257511973',
	Ok = ':greenTick:637706251253317669',
	Cashout = '%F0%9F%92%B0' // 💰
}

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['hilo', 'higherlower', 'hl'],
	description: LanguageKeys.Commands.Games.HigherLowerDescription,
	extendedHelp: LanguageKeys.Commands.Games.HigherLowerExtended,
	requiredClientPermissions: ['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'USE_EXTERNAL_EMOJIS'],
	runIn: ['GUILD_ANY']
})
export class UserCommand extends SkyraCommand {
	private readonly kFirstReactionArray = [HigherLowerReactions.Higher, HigherLowerReactions.Lower, HigherLowerReactions.Cancel] as const;
	private readonly kReactionArray = [HigherLowerReactions.Higher, HigherLowerReactions.Lower, HigherLowerReactions.Cashout] as const;
	private readonly kWinReactionArray = [HigherLowerReactions.Ok, HigherLowerReactions.Cancel] as const;
	private readonly kTimer = minutes(3);

	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const { t } = args;
		const wager = await args.pick('shinyWager');

		const { users } = this.container.db;
		const settings = await users.ensure(message.author.id);
		const balance = settings.money;
		if (balance < wager) {
			this.error(LanguageKeys.Commands.Games.GamesNotEnoughMoney, { money: balance });
		}

		settings.money -= wager;
		await settings.save();

		const response = (await send(message, t(LanguageKeys.Commands.Games.HigherLowerLoading))) as GuildMessage;
		const game: HigherLowerGameData = {
			/** The game's reaction collector */
			llrc: new LongLivingReactionCollector(
				(reaction) => {
					if (game.callback === null) return;

					const emoji = this.resolveCollectedEmoji(message, game, reaction);
					if (emoji === null) return;

					game.callback(emoji);
					game.callback = null;
				},
				async () => {
					if (game.callback !== null) {
						game.callback(null);
						game.callback = null;
					}
					try {
						await this.end(game, message, settings);
					} catch (error) {
						this.container.logger.fatal(error);
					}
				}
			),
			response,
			t,
			running: true,
			turn: 1,
			number: this.random(50),
			wager,
			emojis: this.kFirstReactionArray,
			callback: null,
			color: await this.container.db.fetchColor(message),
			canceledByChoice: false
		};

		while (game.running) {
			// Send the embed
			const fields = game.t(LanguageKeys.Commands.Games.HigherLowerEmbed, {
				turn: game.turn,
				number: game.number
			});

			const embed = new MessageEmbed() //
				.setColor(game.color)
				.setTitle(fields.title)
				.setDescription(fields.description)
				.setFooter(fields.footer);
			await game.response.edit({ embeds: [embed] });

			// Add the options
			const emojis = game.turn > 1 ? this.kReactionArray : this.kFirstReactionArray;
			const emoji = await this.listenForReaction(game, emojis);
			if (emoji === null) break;

			// Main game logic (at last)
			const oldNum = game.number;
			game.number = this.random(oldNum);

			switch (emoji) {
				case HigherLowerReactions.Higher: {
					game.running = await (game.number > oldNum ? this.win(game, message, settings) : this.loss(game, settings));
					break;
				}
				case HigherLowerReactions.Lower: {
					game.running = await (game.number < oldNum ? this.win(game, message, settings) : this.loss(game, settings));
					break;
				}
				case HigherLowerReactions.Cancel:
				case HigherLowerReactions.Cashout: {
					game.canceledByChoice = true;
					await this.end(game, message, settings, emoji === HigherLowerReactions.Cashout);
					game.running = false;
					break;
				}
				case HigherLowerReactions.Ok:
					break;
			}

			if (game.running) game.turn++;
		}

		if (game.response.reactions.cache.size > 0) await game.response.reactions.removeAll();
		return game.response;
	}

	private async listenForReaction(game: HigherLowerGameData, emojis: readonly HigherLowerReactions[]) {
		if (game.response.reactions.cache.size > 0) await game.response.reactions.removeAll();

		game.emojis = emojis;
		for (const emoji of game.emojis) {
			await addReaction(game.response, emoji);
		}

		return new Promise<HigherLowerReactions | null>((res) => {
			game.llrc.setTime(this.kTimer);
			game.callback = res;
		});
	}

	private async win(game: HigherLowerGameData, message: GuildMessage, settings: UserEntity) {
		const fields = game.t(LanguageKeys.Commands.Games.HigherLowerWin, {
			potentials: this.calculateWinnings(game.wager, game.turn),
			number: game.number
		});
		const embed = new MessageEmbed() //
			.setColor(game.color)
			.setTitle(fields.title)
			.setDescription(fields.description)
			.setFooter(fields.footer);
		await game.response.edit({ embeds: [embed] });

		// Ask the user whether they want to continue or cashout
		const emoji = await this.listenForReaction(game, this.kWinReactionArray);

		// Decide whether we timeout, stop, or continue
		switch (emoji) {
			case null: {
				game.llrc.end();
				await this.cashout(message, game, settings);
				break;
			}
			case HigherLowerReactions.Ok: {
				const content = game.t(LanguageKeys.Commands.Games.HigherLowerNewRound);
				await game.response.edit({ content, embeds: [] });
				break;
			}
			case HigherLowerReactions.Cancel: {
				await this.end(game, message, settings, true);
				break;
			}
			default: {
				throw new Error('Unreachable.');
			}
		}

		return emoji === HigherLowerReactions.Ok;
	}

	private async loss(game: HigherLowerGameData, settings: UserEntity) {
		let losses = game.wager;

		// There's a 0.001% chance that a user would lose not only the wager, but also what they would've won in one round less.
		if (Math.random() < 0.0001) {
			losses += this.calculateWinnings(game.wager, game.turn - 1);
			settings.money -= losses;
			await settings.save();
		}

		const fields = game.t(LanguageKeys.Commands.Games.HigherLowerLose, {
			number: game.number,
			losses
		});
		const embed = new MessageEmbed() //
			.setColor(game.color)
			.setTitle(fields.title)
			.setDescription(fields.description)
			.setFooter(fields.footer);
		await game.response.edit({ embeds: [embed] });

		game.llrc.end();
		return false;
	}

	private async end(game: HigherLowerGameData, message: GuildMessage, settings: UserEntity, cashout = false) {
		// End the LLRC
		game.llrc.end();

		// Should we need to cash out, proceed to doing that
		if (cashout) return this.cashout(message, game, settings);

		if (game.canceledByChoice && game.turn === 1) {
			// Say bye!
			const fields = game.t(LanguageKeys.Commands.Games.HigherLowerCancel, {
				username: message.author.username
			});

			const embed = new MessageEmbed() //
				.setColor(game.color)
				.setTitle(fields.title)
				.setDescription(fields.description);
			await game.response.edit({ embeds: [embed] });
		}
	}

	private async cashout(message: GuildMessage, game: HigherLowerGameData, settings: UserEntity) {
		const { turn, wager } = game;

		// Calculate and deposit winnings for that game
		const winnings = this.calculateWinnings(wager, turn - 1);
		settings.money += winnings;
		await settings.save();

		// Let the user know we're done!
		const fields = {
			title: game.t(LanguageKeys.Commands.Games.HigherLowerWin, { potentials: 0, number: 0 }).title,
			footer: game.t(LanguageKeys.Commands.Games.HigherLowerCancel, { username: message.author.username }).description
		};

		const embed = new MessageEmbed()
			.setColor(game.color)
			.setTitle(fields.title)
			.setDescription(game.t(LanguageKeys.Commands.Games.HigherLowerCashout, { amount: winnings }))
			.setFooter(fields.footer);
		await game.response.edit({ embeds: [embed] });
	}

	private resolveCollectedEmoji(message: GuildMessage, game: HigherLowerGameData, reaction: LLRCData) {
		// If the message reacted is not the game's, inhibit
		if (reaction.messageId !== game.response.id) return null;

		// If the user who reacted was not the author, inhibit
		if (reaction.userId !== message.author.id) return null;

		// If the emoji reacted is not valid, inhibit
		const emoji = resolveEmoji(reaction.emoji);
		return emoji !== null && game.emojis.includes(emoji as HigherLowerReactions) ? (emoji as HigherLowerReactions) : null;
	}

	/**
	 * @description Generates a random number between 0 and 100
	 * @param previous The number we shouldn't get (usually the number we're comparing against
	 */
	private random(previous: number) {
		// Check if we're closer to 100 or 0
		const upperLimitIsClosest = previous > 50;

		// The proximity to the given edge
		const proximityToEdge = upperLimitIsClosest ? 99 - previous : previous - 1;
		const range = Math.min(30, proximityToEdge);

		const lower =
			proximityToEdge < 5
				? // If the proximity is less than 5
				  upperLimitIsClosest
					? // And we're closer to 100 then return a number in range [previous - 5..99]
					  this.randomInRange(previous - 5, 99)
					: // Otherwise return a number in range [1..previous + 5]
					  this.randomInRange(1, previous + 5)
				: // Else get the smaller number between 30 and the proximity to the edge
				  // And return a random number in the range of [previous - range..previous + range]
				  this.randomInRange(previous - range, previous + range);

		const higher = lower + 1;

		return previous === lower ? higher : lower;
	}

	/**
	 * Returns a random integer between minimum (inclusive) and maximum (inclusive).
	 * The value is no lower than min (or the next integer greater than min
	 * if min isn't an integer) and no greater than max (or the next integer
	 * lower than max if max isn't an integer).
	 * @param minimum The minimum boundary for the randomization
	 * @param maximum The maximum boundary for the randomization
	 */
	private randomInRange(minimum: number, maximum: number) {
		minimum = Math.ceil(minimum);
		maximum = Math.floor(maximum);
		return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
	}

	private calculateWinnings(bet: number, attempts: number) {
		if (attempts < 0) attempts = 1;
		return Math.round(bet * (attempts <= 4 ? Math.exp(attempts) / 6 : attempts * 5 - 10));
	}
}

interface HigherLowerGameData {
	llrc: LongLivingReactionCollector;
	response: GuildMessage;
	t: TFunction;
	running: boolean;
	number: number;
	turn: number;
	wager: number;
	emojis: readonly HigherLowerReactions[];
	callback: ((value: HigherLowerReactions | null) => void) | null;
	canceledByChoice: boolean;
	color: number;
}
