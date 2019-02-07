import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage, Language, Timestamp } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { fetch } from '../../lib/util/util';

export default class extends SkyraCommand {

	private readonly timestamp = new Timestamp('MMMM, dddd dd YYYY');

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			cooldown: 10,
			description: (language) => language.get('COMMAND_XKCD_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_XKCD_EXTENDED'),
			spam: true,
			usage: '[query:string]'
		});
	}

	public async run(message: KlasaMessage, [input]: [string]) {
		const query = typeof input !== 'undefined'
			? /^\d+$/.test(input) ? Number(input) : input : null;

		const comicNumber = await this.getNumber(query, message.language);
		const comic = await fetch(`https://xkcd.com/${comicNumber}/info.0.json`, 'json')
			.catch(() => { throw message.language.get('COMMAND_XKCD_NOTFOUND'); });

		return message.sendEmbed(new MessageEmbed()
			.setColor(0xD7CCC8)
			.setImage(comic.img)
			.setTitle(comic.title)
			.setURL(`https://xkcd.com/${comicNumber}/`)
			.setFooter(`XKCD | ${comic.num} | ${this.getTime(comic.year, comic.month, comic.day)}`)
			.setDescription(comic.alt)
			.setTimestamp());
	}

	private getTime(year: string, month: string, day: string) {
		return this.timestamp.display(new Date(Number(year), Number(month) - 1, Number(day)));
	}

	private async getNumber(query: string | number, i18n: Language) {
		const xkcdInfo = await fetch('http://xkcd.com/info.0.json', 'json');

		if (typeof query === 'number') {
			if (query <= xkcdInfo.num) return query;
			throw i18n.get('COMMAND_XKCD_COMICS', xkcdInfo.num);
		}

		if (query) {
			const text = await fetch(`https://relevantxkcd.appspot.com/process?action=xkcd&query=${encodeURIComponent(query)}`, 'text');
			const comics = text.split(' ').slice(2);
			const random = Math.floor(Math.random() * (comics.length / 2));
			return parseInt(comics[random * 2].replace(/\n/g, ''));
		}

		return Math.floor(Math.random() * (xkcdInfo.num - 1)) + 1;
	}

}
