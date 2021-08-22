import { Awaited, Piece, PieceOptions } from '@sapphire/framework';
import type { MessageComponentInteraction, Snowflake } from 'discord.js';

export abstract class InteractionHandler<T extends MessageComponentInteraction = MessageComponentInteraction> extends Piece {
	public abstract run(interaction: T): Awaited<unknown>;

	protected handleInteraction(interaction: MessageComponentInteraction): T | null {
		return interaction as T;
	}

	protected getIdContext(interaction: T): InteractionHandler.IdContext {
		const [messageId, action, ...extra] = interaction.customId.slice(this.name.length + 1).split(':');
		return { messageId, action, extra: extra.join(':') };
	}

	protected generateCustomId(messageId: Snowflake, ...extras: readonly string[]) {
		return extras.length === 0 ? `${this.name}:${messageId}` : `${this.name}:${messageId}:${extras.join(':')}`;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InteractionHandler {
	export type Options = PieceOptions;

	export interface IdContext {
		messageId: string;
		action: string;
		extra: string;
	}
}
