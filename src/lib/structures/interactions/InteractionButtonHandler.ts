import type { ButtonInteraction, MessageComponentInteraction } from 'discord.js';
import { InteractionHandler } from './InteractionHandler';

export abstract class InteractionButtonHandler extends InteractionHandler<ButtonInteraction> {
	protected override handleInteraction(interaction: MessageComponentInteraction): ButtonInteraction | null {
		if (interaction.isButton()) return interaction;
		return null;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace InteractionButtonHandler {
	export type Options = InteractionHandler.Options;
	export type IdContext = InteractionHandler.IdContext;
}
