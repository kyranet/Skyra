import { Game } from './Game';
import { Player, PlayerColor } from './Player';
import { KlasaUser } from 'klasa';
import { Cell } from './Board';
import { LLRCDataEmoji } from '../../LongLivingReactionCollector';
import { CONNECT_FOUR } from '../../constants';
import { TextChannel, Permissions, DiscordAPIError } from 'discord.js';
import { Events } from '../../../types/Enums';
import { resolveEmoji } from '../../util';

export class PlayerHuman extends Player {

	private player: KlasaUser;

	public constructor(game: Game, cell: Cell, winning: Cell, color: PlayerColor, player: KlasaUser) {
		super(game, cell, winning, color, player.username);
		this.player = player;
	}

	/**
	 * Whether Skyra has the MANAGE_MESSAGES permission or not
	 */
	private get manageMessages(): boolean {
		const message = this.game.message;
		return (message.channel as TextChannel).permissionsFor(message.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES);
	}

	public async start() {
		const reaction = await new Promise<string>(resolve => {
			this.game.llrc.setTime(120000);
			this.game.llrc.setEndListener(() => resolve(''));
			this.game.llrc.setListener(data => {
				if (data.userID === this.player.id && CONNECT_FOUR.REACTIONS.includes(data.emoji.name)) {
					if (this.manageMessages) {
						this.removeEmoji(data.emoji, data.userID)
							.catch(error => this.game.message.client.emit(Events.ApiError, error));
					}
					resolve(data.emoji.name);
				}
			});
		});

		if (!reaction) {
			this.game.content = this.game.language.get('COMMAND_GAMES_TIMEOUT');
			this.game.stop();
		} else if (!this.drop(CONNECT_FOUR.REACTIONS.indexOf(reaction))) {
			return this.start();
		}
	}

	public finish() {
		super.finish();
		this.game.llrc.setTime(-1);
		this.game.llrc.setListener(null);
	}

	private async removeEmoji(emoji: LLRCDataEmoji, userID: string): Promise<void> {
		try {
			// @ts-ignore
			await this.client.api.channels[this.message.channel.id].messages[this.message.id]
				.reactions[resolveEmoji(emoji)][userID].delete();
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				// Unknown Message | Unknown Emoji
				if (error.code === 10008 || error.code === 10014) return;
			}

			this.game.message.client.emit(Events.ApiError, error);
		}
	}

}
