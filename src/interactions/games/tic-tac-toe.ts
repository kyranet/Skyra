import { InteractionButtonHandler } from '#lib/structures';
import { ButtonInteraction, MessageActionRow, MessageButton, Snowflake } from 'discord.js';

export class UserInteractionButtonHandler extends InteractionButtonHandler {
	private readonly boardButtonDesign = [
		{ style: 'SECONDARY', label: ' ', disabled: false },
		{ style: 'PRIMARY', label: 'O', disabled: true },
		{ style: 'SUCCESS', label: 'X', disabled: true }
	] as const;

	private readonly boardCells = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8]
	] as const;

	public run(interaction: ButtonInteraction) {
		const game = this.hydrateGame(this.getIdContext(interaction));
		if (interaction.user.id === game.players[1]) {
			return interaction.reply({ content: 'It is not your turn yet.', ephemeral: true });
		}

		if (interaction.user.id !== game.players[0]) {
			return interaction.reply({ content: 'This is not your game!', ephemeral: true });
		}

		this.advanceTurn(game);
		return interaction.update({ content: `Turn for: <@${game.players[0]}>`, components: this.generateComponents(game) });
	}

	private advanceTurn(game: GameContext) {
		game.board[game.cell] = game.turn;
		game.turn = game.turn === 0 ? 1 : 0;
		[game.players[0], game.players[1]] = [game.players[1], game.players[0]];
	}

	private hydrateGame(context: InteractionButtonHandler.IdContext): GameContext {
		const [rawTurn, rawCell, rawCells, rawPlayers] = context.extra.split(':');

		const turn = rawTurn === '0' ? 0 : 1;
		const cell = Number(rawCell);
		const players = rawPlayers.split('-') as [Snowflake, Snowflake];
		const board = new Uint8Array(9);
		for (let i = 0; i < 9; ++i) {
			board[i] = Number(rawCells[i]);
		}

		return { ...context, turn, cell, players, board };
	}

	private generateComponents(game: GameContext) {
		return [this.generateButtonRow(game, 0), this.generateButtonRow(game, 1), this.generateButtonRow(game, 2)];
	}

	private generateButtonRow(game: GameContext, rowIndex: number) {
		const row = new MessageActionRow();

		for (const cell of this.boardCells[rowIndex]) {
			row.addComponents(this.generateCellButton(game, cell));
		}

		return row;
	}

	private generateCellButton(game: GameContext, cell: number) {
		const value = game.board[cell];
		const design = this.boardButtonDesign[value];
		const customId =
			value === 0
				? this.generateCustomId(game.messageId, 'set', cell.toString(), game.players.join('-'))
				: this.generateCustomId(game.messageId, 'skip', cell.toString());

		return new MessageButton() //
			.setCustomId(customId)
			.setStyle(design.style)
			.setLabel(design.label)
			.setDisabled(design.disabled);
	}
}

interface GameContext extends InteractionButtonHandler.IdContext {
	turn: 0 | 1;
	cell: number;
	players: [Snowflake, Snowflake];
	board: Uint8Array;
}
