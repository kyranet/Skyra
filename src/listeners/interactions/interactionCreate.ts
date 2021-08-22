import { Listener } from '@sapphire/framework';
import type { Interaction, MessageComponentInteraction } from 'discord.js';

export class UserListener extends Listener<'interactionCreate'> {
	public async run(interaction: Interaction) {
		if (!interaction.isMessageComponent()) return;

		const id = this.getId(interaction);
		if (id === null) return interaction.reply('Invalid data');

		const handler = this.container.stores.get('interactions').get(id);
		if (handler === undefined) return interaction.reply('Invalid data');

		// eslint-disable-next-line @typescript-eslint/dot-notation
		const resolved = handler['handleInteraction'](interaction);
		if (resolved === null) return interaction.reply('Invalid data');

		try {
			await handler.run(resolved);
		} catch (error) {
			await interaction.reply({ content: error.message });
		}
	}

	private getId(interaction: MessageComponentInteraction) {
		const index = interaction.customId.indexOf(':');
		return index === -1 ? null : interaction.customId.slice(0, index);
	}
}
