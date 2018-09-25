const { Command, util: { fetch, cutText }, MessageEmbed } = require('../../index');

const API_URL = 'https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&indexpageids=1&redirects=1&explaintext=1&exsectionformat=plain&titles=';

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['wiki'],
			requiredPermissions: ['EMBED_LINKS'],
			cooldown: 15,
			description: (language) => language.get('COMMAND_WIKIPEDIA_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WIKIPEDIA_EXTENDED'),
			usage: '<query:string>'
		});
	}

	public async run(msg, [input]) {
		input = this.parseURL(input);
		const text = await fetch(API_URL + input, 'json');

		if (text.query.pageids[0] === '-1')
			throw msg.language.get('COMMAND_WIKIPEDIA_NOTFOUND');

		const url = `https://en.wikipedia.org/wiki/${input}`;
		const content = text.query.pages[text.query.pageids[0]];
		const definition = this.content(content.extract, url, msg.language);

		return msg.sendEmbed(new MessageEmbed()
			.setTitle(content.title)
			.setURL(url)
			.setColor(0x05C9E8)
			.setThumbnail('https://en.wikipedia.org/static/images/project-logos/enwiki.png')
			.setDescription(definition
				.replace(/\n{2,}/g, '\n')
				.replace(/\s{2,}/g, ' '))
			.setFooter('© Wikipedia'));
	}

	public parseURL(url) {
		return encodeURIComponent(
			url
				.toLowerCase()
				.replace(/[ ]/g, '_')
				.replace(/\(/g, '%28')
				.replace(/\)/g, '%29'),
		);
	}

	public content(definition, url, i18n) {
		if (definition.length < 750) return definition;
		return i18n.get('SYSTEM_TEXT_TRUNCATED', cutText(definition, 750), url);
	}

}
