import { InteractionButtonHandler } from '#lib/structures';
import { ButtonInteraction, MessageActionRow, MessageButton, Snowflake } from 'discord.js';

export class UserInteractionButtonHandler extends InteractionButtonHandler {
	public run(interaction: ButtonInteraction) {
		// TODO: This needs Forms, gdi.
		return interaction.update({ components: [this.generateButtons(interaction)] });
	}

	private generateButtons(interaction: ButtonInteraction) {
		const messageId = interaction.message.id;
		const context = this.getIdContext(interaction);

		return new MessageActionRow() //
			.addComponents(this.generateStopButton(messageId))
			.addComponents(this.generateBackButton(messageId, context));
	}

	private generateStopButton(messageId: Snowflake) {
		return new MessageButton() //
			.setCustomId(this.generateCustomId(messageId, 'stop'))
			.setStyle('DANGER')
			.setLabel('Close');
	}

	private generateBackButton(messageId: Snowflake, context: InteractionButtonHandler.IdContext) {
		return new MessageButton()
			.setCustomId(this.generateCustomId(messageId, 'back', this.generateBackButtonId(context.extra)))
			.setStyle('PRIMARY')
			.setDisabled(context.extra === 'root')
			.setLabel('Back');
	}

	private generateBackButtonId(path: string) {
		if (path === 'root') return 'root';

		const index = path.lastIndexOf('.');
		if (index === -1) return 'root';

		return path.slice(0, index);
	}
}
