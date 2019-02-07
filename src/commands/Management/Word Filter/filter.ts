import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 5,
			description: (language) => language.get('COMMAND_FILTER_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_FILTER_EXTENDED'),
			permissionLevel: 5,
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|reset|show:default> (word:word)',
			usageDelim: ' '
		});

		this.createCustomResolver('word', (arg, _, msg, [type]) => {
			if (type === 'reset' || type === 'show') return undefined;
			if (arg) return arg.toLowerCase();
			throw msg.language.get('COMMAND_FILTER_UNDEFINED_WORD');
		});
	}

	public async add(message: KlasaMessage, [word]: [string]) {
		// Check if the word is not filtered
		const raw = message.guild.settings.get(GuildSettings.Filter.Raw) as GuildSettings.Filter.Raw;
		const regexp = message.guild.security.regexp;
		if (raw.includes(word) || (regexp && regexp.test(word))) throw message.language.get('COMMAND_FILTER_FILTERED', true);

		// Perform update
		await message.guild.settings.update(GuildSettings.Filter.Raw, word, { arrayAction: 'add' });
		message.guild.security.updateRegExp(message.guild.settings.get(GuildSettings.Filter.Raw) as GuildSettings.Filter.Raw);
		return message.sendLocale('COMMAND_FILTER_ADDED', [word]);
	}

	public async remove(message: KlasaMessage, [word]: [string]) {
		// Check if the word is already filtered
		const raw = message.guild.settings.get(GuildSettings.Filter.Raw) as GuildSettings.Filter.Raw;
		if (!raw.includes(word)) throw message.language.get('COMMAND_FILTER_FILTERED', false);

		// Perform update
		if (raw.length === 1) return this.reset(message);
		await message.guild.settings.update(GuildSettings.Filter.Raw, word, { arrayAction: 'remove' });
		message.guild.security.updateRegExp(message.guild.settings.get(GuildSettings.Filter.Raw) as GuildSettings.Filter.Raw);
		return message.sendLocale('COMMAND_FILTER_REMOVED', [word]);
	}

	public async reset(message: KlasaMessage) {
		await message.guild.settings.reset(GuildSettings.Filter.Raw);
		message.guild.security.regexp = null;
		return message.sendLocale('COMMAND_FILTER_RESET');
	}

	public show(message: KlasaMessage) {
		const raw = message.guild.settings.get(GuildSettings.Filter.Raw) as GuildSettings.Filter.Raw;
		return message.sendMessage(!raw.length
			? message.language.get('COMMAND_FILTER_SHOW_EMPTY')
			: message.language.get('COMMAND_FILTER_SHOW', `\`${raw.join('`, `')}\``));
	}

}
