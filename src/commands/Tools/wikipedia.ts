import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage, Language } from 'klasa';
import { URL } from 'url';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { cutText, fetch } from '../../lib/util/util';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['wiki'],
			cooldown: 15,
			description: (language) => language.get('COMMAND_WIKIPEDIA_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WIKIPEDIA_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			usage: '<query:string>'
		});
	}

	public async run(message: KlasaMessage, [input]: [string]) {
		const url = new URL('https://en.wikipedia.org/w/api.php');
		url.searchParams.append('action', 'query');
		url.searchParams.append('format', 'json');
		url.searchParams.append('prop', 'extracts');
		url.searchParams.append('indexpageids', '1');
		url.searchParams.append('redirects', '1');
		url.searchParams.append('explaintext', '1');
		url.searchParams.append('exsectionformat', 'plain');
		url.searchParams.append('titles', this.parseURL(input));
		const text = await fetch(url, 'json');

		if (text.query.pageids[0] === '-1')
			throw message.language.get('COMMAND_WIKIPEDIA_NOTFOUND');

		const pageURL = `https://en.wikipedia.org/wiki/${url.searchParams.get('titles')}`;
		const content = text.query.pages[text.query.pageids[0]];
		const definition = this.content(content.extract, pageURL, message.language);

		return message.sendEmbed(new MessageEmbed()
			.setTitle(content.title)
			.setURL(pageURL)
			.setColor(0x05C9E8)
			.setThumbnail('https://en.wikipedia.org/static/images/project-logos/enwiki.png')
			.setDescription(definition
				.replace(/\n{2,}/g, '\n')
				.replace(/\s{2,}/g, ' '))
			.setFooter('© Wikipedia'));
	}

	private parseURL(url: string) {
		return encodeURIComponent(
			url
				.toLowerCase()
				.replace(/[ ]/g, '_')
				.replace(/\(/g, '%28')
				.replace(/\)/g, '%29'),
		);
	}

	private content(definition: string, url: string, i18n: Language) {
		if (definition.length < 750) return definition;
		return i18n.get('SYSTEM_TEXT_TRUNCATED', cutText(definition, 750), url);
	}

}
