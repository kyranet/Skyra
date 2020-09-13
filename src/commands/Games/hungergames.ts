import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { CLIENT_ID } from '@root/config';
import { chunk, isFunction } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { Time } from '@utils/constants';
import { HungerGamesUsage } from '@utils/Games/HungerGamesUsage';
import { LLRCData, LongLivingReactionCollector } from '@utils/LongLivingReactionCollector';
import { sleep } from '@utils/sleep';
import { cleanMentions, floatPromise } from '@utils/util';
import { KlasaMessage, Language } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['hunger-games', 'hg'],
	cooldown: 0,
	description: (language) => language.get('commandHungerGamesDescription'),
	extendedHelp: (language) => language.get('commandHungerGamesExtended'),
	requiredPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
	runIn: ['text'],
	usage: '[user:string{,50}] [...]',
	usageDelim: ',',
	flagSupport: true
})
export default class extends SkyraCommand {
	public readonly playing: Set<string> = new Set();
	public readonly kEmojis = ['🇳', '🇾'];

	public async run(message: KlasaMessage, tributes: string[] = []) {
		const autoFilled = message.flagArgs.autofill;
		const autoSkip = message.flagArgs.autoskip;

		if (autoFilled) {
			const messages = await message.channel.messages.fetch({ limit: 100 });

			for (const { author } of messages.values()) {
				if (author && !tributes.includes(author.username)) tributes.push(author.username);
			}
		} else if (tributes.length === 0) {
			throw message.language.get('commandGamesNoPlayers', { prefix: message.guild!.settings.get(GuildSettings.Prefix) });
		}

		const filtered = new Set(tributes);
		if (filtered.size !== tributes.length) throw message.language.get('commandGamesRepeat');
		if (this.playing.has(message.channel.id)) throw message.language.get('commandGamesProgress');
		if (filtered.size < 4 || filtered.size > 48) throw message.language.get('commandGamesTooManyOrFew', { min: 4, max: 48 });
		this.playing.add(message.channel.id);

		let resolve: ((value?: boolean) => void) | null = null;
		let gameMessage: KlasaMessage | null = null;
		const game: HungerGamesGame = Object.seal({
			bloodbath: true,
			llrc: new LongLivingReactionCollector(
				this.client,
				async (reaction) => {
					// Ignore if resolve is not ready
					if (
						!isFunction(resolve) ||
						// Run the collector inhibitor
						(await this.collectorInhibitor(message, gameMessage!, reaction))
					)
						return;
					resolve(Boolean(this.kEmojis.indexOf(reaction.emoji.name)));
					resolve = null;
				},
				() => {
					if (isFunction(resolve)) resolve(false);
					this.playing.delete(message.channel.id);
				}
			),
			sun: true,
			tributes: this.shuffle([...filtered].map(cleanMentions.bind(null, message.guild!))),
			turn: 0
		});

		try {
			while (game.tributes.size > 1) {
				// If it's not bloodbath and it became the day, increase the turn
				if (!game.bloodbath && game.sun) ++game.turn;
				const events = game.bloodbath ? 'hgBloodbath' : game.sun ? 'hgDay' : 'hgNight';

				// Main logic of the game
				const { results, deaths } = this.makeResultEvents(game, message.language.get(events).map(HungerGamesUsage.create));
				const texts = this.buildTexts(message.language, game, results, deaths);

				// Ask for the user to proceed:
				for (const text of texts) {
					// If the channel is not postable, break:
					if (!message.channel.postable) return;

					// Refresh the LLRC's timer, send new message with new reactions:
					game.llrc.setTime(Time.Minute * 2);
					gameMessage = (await message.channel.send(text)) as KlasaMessage;
					for (const emoji of ['🇾', '🇳']) {
						await gameMessage.react(emoji);
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
					floatPromise(this, gameMessage.nuke());
					if (!verification) return message.channel.postable ? message.sendLocale('commandHungerGamesStop') : undefined;
				}
				if (game.bloodbath) game.bloodbath = false;
				else game.sun = !game.sun;
			}

			// The match finished with one remaining player
			return message.sendLocale('commandHungerGamesWinner', [{ winner: game.tributes.values().next().value }]);
		} finally {
			game.llrc.end();
		}
	}

	private async collectorInhibitor(message: KlasaMessage, gameMessage: KlasaMessage, reaction: LLRCData) {
		// If there's no gameMessage, inhibit
		if (!gameMessage) return true;

		// If the message reacted is not the game's, inhibit
		if (reaction.messageID !== gameMessage.id) return true;

		// If the emoji reacted is not valid, inhibit
		if (!this.kEmojis.includes(reaction.emoji.name)) return true;

		// If the user who reacted is the author, don't inhibit
		if (reaction.userID === message.author.id) return false;

		// Don't listen to herself
		if (reaction.userID === CLIENT_ID) return true;

		try {
			// Fetch the member for level measuring purposes
			const member = await message.guild!.members.fetch(reaction.userID);
			// Check if the user is a moderator
			const hasLevel = await KlasaMessage.prototype.hasAtLeastPermissionLevel.call(
				{
					author: member.user,
					client: this.client,
					guild: member.guild,
					member
				},
				5
			);
			return !hasLevel;
		} catch {
			return true;
		}
	}

	private buildTexts(language: Language, game: HungerGamesGame, results: string[], deaths: string[]) {
		const header = language.get('commandHungerGamesResultHeader', { game });
		const death = deaths.length
			? `${language.get('commandHungerGamesResultDeaths', { deaths: deaths.length })}\n\n${deaths.map((d) => `- ${d}`).join('\n')}`
			: '';
		const proceed = language.get('commandHungerGamesResultProceed');
		const panels = chunk(results, 5);

		const texts = panels.map((panel) => `__**${header}:**__\n\n${panel.map((text) => `- ${text}`).join('\n')}\n\n_${proceed}_`);
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
