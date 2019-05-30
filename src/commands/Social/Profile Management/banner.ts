import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { UserRichDisplay } from '../../../lib/structures/UserRichDisplay';
import { Databases } from '../../../lib/types/constants/Constants';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';
import { UserSettings } from '../../../lib/types/settings/UserSettings';
import { EMOJIS } from '../../../lib/util/constants';
import { getColor } from '../../../lib/util/util';

const CDN_URL = 'https://cdn.skyra.pw/img/banners/';

export default class extends SkyraCommand {

	private readonly banners: Map<string, BannerCache> = new Map();
	private readonly listPrompt = this.definePrompt('<all|user>');
	private display = null;

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['banners'],
			bucket: 2,
			cooldown: 10,
			description: language => language.get('COMMAND_BANNER_DESCRIPTION'),
			extendedHelp: language => language.get('COMMAND_BANNER_EXTENDED'),
			requiredPermissions: ['MANAGE_MESSAGES', 'EMBED_LINKS'],
			runIn: ['text'],
			subcommands: true,
			usage: '<buy|reset|set|show:default> (banner:banner)',
			usageDelim: ' '
		});

		this.createCustomResolver('banner', (arg, _, msg, [type]) => {
			if (type === 'show' || type === 'reset') return undefined;
			if (!arg) throw msg.language.get('COMMAND_BANNER_MISSING');
			const banner = this.banners.get(arg);
			if (banner) return banner;
			throw msg.language.get('COMMAND_BANNER_NOTEXISTS');
		});
	}

	public async buy(message: KlasaMessage, [banner]: [BannerCache]) {
		const banners = new Set(message.author.settings.get(UserSettings.BannerList) as UserSettings.BannerList);
		if (banners.has(banner.id)) throw message.language.get('COMMAND_BANNER_BOUGHT', message.guild.settings.get(GuildSettings.Prefix) as GuildSettings.Prefix, banner.id);

		const money = message.author.settings.get(UserSettings.Money) as UserSettings.Money;
		if (money < banner.price) throw message.language.get('COMMAND_BANNER_MONEY', money, banner.price);

		const accepted = await this._prompt(message, banner);
		if (!accepted) throw message.language.get('COMMAND_BANNER_PAYMENT_CANCELLED');

		if (money < banner.price) throw message.language.get('COMMAND_BANNER_MONEY', money, banner.price);

		banners.add(banner.id);

		const user = await this.client.users.fetch(banner.author);
		await user.settings.sync();

		await Promise.all([
			message.author.settings.update([[UserSettings.Money, money - banner.price], [UserSettings.BannerList, [...banners]]], { arrayAction: 'overwrite' }),
			user.settings.increase(UserSettings.Money, banner.price * 0.1)
		]);

		return message.sendLocale('COMMAND_BANNER_BUY', [banner.title]);
	}

	public async reset(message: KlasaMessage) {
		const banners = message.author.settings.get(UserSettings.BannerList) as UserSettings.BannerList;
		if (!banners.length) throw message.language.get('COMMAND_BANNER_USERLIST_EMPTY');
		if (message.author.settings.get(UserSettings.ThemeProfile) === '0001') throw message.language.get('COMMAND_BANNER_RESET_DEFAULT');

		await message.author.settings.update(UserSettings.ThemeProfile, '0001');
		return message.sendLocale('COMMAND_BANNER_RESET');
	}

	public async set(message: KlasaMessage, [banner]: [BannerCache]) {
		const banners = message.author.settings.get(UserSettings.BannerList) as UserSettings.BannerList;
		if (!banners.length) throw message.language.get('COMMAND_BANNER_USERLIST_EMPTY');
		if (!banners.includes(banner.id)) throw message.language.get('COMMAND_BANNER_SET_NOT_BOUGHT');

		await message.author.settings.update(UserSettings.ThemeProfile, banner.id);
		return message.sendLocale('COMMAND_BANNER_SET', [banner.title]);
	}

	public async show(message: KlasaMessage) {
		const [response] = await this.listPrompt.createPrompt(message).run(message.language.get('COMMAND_BANNER_PROMPT'));
		return response === 'all' ? this._buyList(message) : this._userList(message);
	}

	public async init() {
		const table = await this.client.providers.default.getAll(Databases.Banners) as Array<BannerList>;
		const display = new UserRichDisplay(new MessageEmbed().setColor(0xFFAB40));
		for (const list of table) {
			for (const banner of list.banners) {
				this.banners.set(banner.id, {
					author: banner.author,
					authorName: null,
					id: banner.id,
					list: list.id,
					price: banner.price,
					title: banner.title
				});

				display.addPage(template => template
					.setImage(`${CDN_URL}${banner.id}.png`)
					.setTitle(banner.title)
					.setDescription(`• ID: \`${banner.id}\`\n• ${banner.price}${EMOJIS.SHINY}`));
			}
		}

		this.display = display;
	}

	private _buyList(message: KlasaMessage) {
		return this._runDisplay(message, this.display);
	}

	private _userList(message: KlasaMessage) {
		const prefix = message.guild.settings.get(GuildSettings.Prefix) as GuildSettings.Prefix;
		const banners = new Set(message.author.settings.get(UserSettings.BannerList) as UserSettings.BannerList);
		if (!banners.size) throw message.language.get('COMMAND_BANNER_USERLIST_EMPTY', prefix);

		const display = new UserRichDisplay(new MessageEmbed().setColor(getColor(message) || 0xFFAB2D));
		for (const id of banners) {
			const banner = this.banners.get(id);
			if (banner) {
				display.addPage(template => template
					.setImage(`${CDN_URL}${banner.id}.png`)
					.setTitle(banner.title)
					.setDescription(`• ID: \`${banner.id}\`\n• ${banner.price}${EMOJIS.SHINY}`));
			}
		}

		return this._runDisplay(message, display);
	}

	private async _runDisplay(message: KlasaMessage, display: UserRichDisplay) {
		const response = await message.sendEmbed(new MessageEmbed({ description: message.language.get('SYSTEM_LOADING'), color: getColor(message) || 0xFFAB2D })) as KlasaMessage;
		await display.run(response, message.author.id);
		return response;
	}

	private async _prompt(message: KlasaMessage, banner: BannerCache) {
		const embed = new MessageEmbed()
			.setColor(getColor(message) || 0xFFAB2D)
			.setDescription([
				`**Title**: ${banner.title} (\`${banner.id}\`)`,
				`**Price**: ${banner.price}${EMOJIS.SHINY}`
			].join('\n'))
			.setImage(`${CDN_URL}${banner.id}.png`)
			.setTimestamp();

		return message.ask({ embed });
	}

}

interface BannerList {
	banners: Array<BannerEntry>;
	id: string;
}

interface BannerEntry {
	author: string;
	id: string;
	price: number;
	resAuthor: string;
	title: string;
}

interface BannerCache {
	author: string;
	authorName: null;
	id: string;
	list: string;
	price: number;
	title: string;
}
