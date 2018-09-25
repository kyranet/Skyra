const { Command, config: { tokens: { google: KEY } }, MessageEmbed, util: { fetch } } = require('../../index');

const REG_GOOGL = /^https:\/\/goo\.gl\/.+/;
const LONG_URL = new URL('https://www.googleapis.com/urlshortener/v1/url');
LONG_URL.searchParams.set('key', KEY);

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['shortenurl', 'googleshorturl', 'shorten'],
			requiredPermissions: ['EMBED_LINKS'],
			cooldown: 15,
			description: (language) => language.get('COMMAND_GOOGL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_GOOGL_EXTENDED'),
			usage: '<URL:url>'
		});
	}

	public async run(msg, [url]) {
		const embed = new MessageEmbed()
			.setDescription(await (REG_GOOGL.test(url) ? this.short(url, msg.language) : this.long(url, msg.language)))
			.setTimestamp();
		return msg.sendMessage({ embed });
	}

	public async long(longUrl, i18n) {
		const body = await fetch(LONG_URL, { method: 'POST', body: { longUrl } }, 'json');
		return i18n.get('COMMAND_GOOGL_LONG', body.id);
	}

	public async short(shortUrl, i18n) {
		const url = new URL('https://www.googleapis.com/urlshortener/v1/url');
		url.searchParams.append('key', KEY);
		url.searchParams.append('shortURL', shortUrl);

		const body = await fetch(url, 'json');
		return i18n.get('COMMAND_GOOGL_SHORT', body.longUrl);
	}

}
