import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 5,
			description: language => language.tget('COMMAND_FILTER_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_FILTER_EXTENDED'),
			permissionLevel: PermissionLevels.Administrator,
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|reset|show:default> (word:word)',
			usageDelim: ' '
		});

		this.createCustomResolver('word', (arg, _, msg, [type]) => {
			if (type === 'reset' || type === 'show') return undefined;
			if (arg) return arg.toLowerCase();
			throw msg.language.tget('COMMAND_FILTER_UNDEFINED_WORD');
		});
	}

	public async add(message: KlasaMessage, [word]: [string]) {
		// Check if the word is not filtered
		const raw = message.guild!.settings.get(GuildSettings.Selfmod.Filter.Raw);
		const { regexp } = message.guild!.security;
		if (raw.includes(word) || (regexp && regexp.test(word))) throw message.language.tget('COMMAND_FILTER_FILTERED', true);

		// Perform update
		await message.guild!.settings.update(GuildSettings.Selfmod.Filter.Raw, word, { arrayAction: 'add' });
		return message.sendLocale('COMMAND_FILTER_ADDED', [word]);
	}

	public async remove(message: KlasaMessage, [word]: [string]) {
		// Check if the word is already filtered
		const raw = message.guild!.settings.get(GuildSettings.Selfmod.Filter.Raw);
		if (!raw.includes(word)) throw message.language.tget('COMMAND_FILTER_FILTERED', false);

		// Perform update
		if (raw.length === 1) return this.reset(message);
		await message.guild!.settings.update(GuildSettings.Selfmod.Filter.Raw, word, { arrayAction: 'remove' });
		return message.sendLocale('COMMAND_FILTER_REMOVED', [word]);
	}

	public async reset(message: KlasaMessage) {
		await message.guild!.settings.reset(GuildSettings.Selfmod.Filter.Raw);
		message.guild!.security.regexp = null;
		return message.sendLocale('COMMAND_FILTER_RESET');
	}

	public show(message: KlasaMessage) {
		const raw = message.guild!.settings.get(GuildSettings.Selfmod.Filter.Raw);
		return message.sendMessage(raw.length
			? message.language.tget('COMMAND_FILTER_SHOW', `\`${raw.join('`, `')}\``)
			: message.language.tget('COMMAND_FILTER_SHOW_EMPTY'));
	}

}
