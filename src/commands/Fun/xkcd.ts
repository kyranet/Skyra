import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Fun.XkcdDescription,
	extendedHelp: LanguageKeys.Commands.Fun.XkcdExtended,
	requiredClientPermissions: ['EMBED_LINKS'],
	spam: true
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const query = await args.pick('integer').catch(() => args.rest('string').catch(() => null));

		const comicNumber = await this.getNumber(query);
		const comic = await fetch<XkcdResultOk>(`https://xkcd.com/${comicNumber}/info.0.json`, FetchResultTypes.JSON).catch(() => {
			this.error(LanguageKeys.Commands.Fun.XkcdNotFound);
		});

		const embed = new MessageEmbed()
			.setColor(await this.container.db.fetchColor(message))
			.setImage(comic.img)
			.setTitle(comic.title)
			.setURL(`https://xkcd.com/${comicNumber}/`)
			.setFooter(`XKCD | ${comic.num}`)
			.setDescription(comic.alt)
			.setTimestamp(this.getTime(comic.year, comic.month, comic.day));
		return send(message, { embeds: [embed] });
	}

	private getTime(year: string, month: string, day: string) {
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	private async getNumber(query: string | number | null) {
		if (typeof query === 'string') {
			const text = await fetch(
				`https://relevantxkcd.appspot.com/process?action=xkcd&query=${encodeURIComponent(query)}`,
				FetchResultTypes.Text
			);
			const comics = text.split(' ').slice(2);
			const random = Math.floor(Math.random() * (comics.length / 2));
			return parseInt(comics[random * 2].replace(/\n/g, ''), 10);
		}

		const xkcdInfo = (await fetch('https://xkcd.com/info.0.json', FetchResultTypes.JSON)) as XkcdResultOk;

		if (typeof query === 'number') {
			if (query <= xkcdInfo.num) return query;
			this.error(LanguageKeys.Commands.Fun.XkcdComics, { amount: xkcdInfo.num });
		}

		return Math.floor(Math.random() * (xkcdInfo.num - 1)) + 1;
	}
}

export interface XkcdResultOk {
	month: string;
	num: number;
	link: string;
	year: string;
	news: string;
	safe_title: string;
	transcript: string;
	alt: string;
	img: string;
	title: string;
	day: string;
}
