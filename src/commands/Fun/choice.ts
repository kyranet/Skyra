import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { CommandStore, KlasaMessage, Language } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['choose', 'choise', 'pick'],
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_CHOICE_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_CHOICE_EXTENDED'),
			usage: '<words:string> [...]',
			usageDelim: ',',
			spam: true
		});
	}

	public async run(message: KlasaMessage, options: string[]) {
		const words = this.filterWords(options, message.language);
		return message.sendLocale('COMMAND_CHOICE_OUTPUT', [
			{
				user: message.author.toString(),
				word: words[Math.floor(Math.random() * words.length)]
			}
		]);
	}

	private filterWords(words: string[], i18n: Language) {
		if (words.length < 2) throw i18n.get('COMMAND_CHOICE_MISSING');

		const output = new Set<string>();
		const filtered = new Set<string>();
		for (const raw of words) {
			const word = raw.trim();
			if (!word) continue;
			if (output.has(word)) filtered.add(word);
			else output.add(word);
		}

		if (output.size >= 2) return [...output];
		throw i18n.get('COMMAND_CHOICE_DUPLICATES', { words: [...filtered].join("', '") });
	}
}
