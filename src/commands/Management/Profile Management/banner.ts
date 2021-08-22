import { GuildSettings, readSettings, UserEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand, SkyraPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { CdnUrls } from '#lib/types/Constants';
import { BrandingColors, Emojis } from '#utils/constants';
import { promptConfirmation } from '#utils/functions';
import { sendLoadingMessage } from '#utils/util';
import { ApplyOptions, RequiresClientPermissions } from '@sapphire/decorators';
import { Args, CommandContext } from '@sapphire/framework';
import { roundNumber } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import { MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

const CDN_URL = CdnUrls.BannersBasePath;

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['banners', 'wallpaper', 'wallpapers', 'background', 'backgrounds'],
	description: LanguageKeys.Commands.Social.BannerDescription,
	extendedHelp: LanguageKeys.Commands.Social.BannerExtended,
	requiredClientPermissions: ['MANAGE_MESSAGES'],
	runIn: ['GUILD_ANY'],
	subCommands: ['buy', 'reset', 'set', { input: 'show', default: true }]
})
export class UserCommand extends SkyraCommand {
	private display: SkyraPaginatedMessage = null!;

	@RequiresClientPermissions(['EMBED_LINKS'])
	public async buy(message: GuildMessage, args: SkyraCommand.Args, { prefix }: CommandContext) {
		const { users } = this.container.db;
		const banner = await args.pick(UserCommand.banner);

		const author = await users.ensureProfile(message.author.id);
		const banners = new Set(author.profile.banners);
		if (banners.has(banner.id)) {
			this.error(LanguageKeys.Commands.Social.BannerBought, { prefix, banner: banner.id });
		}

		if (author.money < banner.price) this.error(LanguageKeys.Commands.Social.BannerMoney, { money: author.money, cost: banner.price });

		const accepted = await this.buyPrompt(message, banner);
		if (!accepted) this.error(LanguageKeys.Commands.Social.BannerPaymentCancelled);

		await users.manager.transaction(async (em) => {
			const existingBannerAuthor = await em.findOne(UserEntity, banner.author);
			if (existingBannerAuthor) {
				existingBannerAuthor.money += roundNumber(banner.price * 0.1);
				await em.save(existingBannerAuthor);
			} else {
				await em.insert(UserEntity, {
					id: banner.author,
					money: roundNumber(banner.price * 0.1)
				});
			}

			banners.add(banner.id);
			author.profile.banners = [...banners];
			author.money -= banner.price;
			await em.save(author);
		});

		const content = args.t(LanguageKeys.Commands.Social.BannerBuy, { banner: banner.title });
		return send(message, content);
	}

	public async reset(message: GuildMessage, args: SkyraCommand.Args, { prefix }: CommandContext) {
		const { users } = this.container.db;

		await users.lock([message.author.id], async (id) => {
			const user = await users.ensureProfile(id);
			if (!user.profile.banners.length) this.error(LanguageKeys.Commands.Social.BannerUserListEmpty, { prefix });
			if (user.profile.bannerProfile === '0001') this.error(LanguageKeys.Commands.Social.BannerResetDefault);

			user.profile.bannerProfile = '0001';
			return user.save();
		});

		const content = args.t(LanguageKeys.Commands.Social.BannerReset);
		return send(message, content);
	}

	public async set(message: GuildMessage, args: SkyraCommand.Args, { prefix }: CommandContext) {
		const { users } = this.container.db;
		const banner = await args.pick(UserCommand.banner);

		await users.lock([message.author.id], async (id) => {
			const user = await users.ensureProfile(id);
			if (!user.profile.banners.length) this.error(LanguageKeys.Commands.Social.BannerUserListEmpty, { prefix });
			if (!user.profile.banners.includes(banner.id)) this.error(LanguageKeys.Commands.Social.BannerSetNotBought);

			user.profile.bannerProfile = banner.id;
			return user.save();
		});

		const content = args.t(LanguageKeys.Commands.Social.BannerSet, { banner: banner.title });
		return send(message, content);
	}

	@RequiresClientPermissions(['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
	public async show(message: GuildMessage, args: SkyraCommand.Args) {
		const allOrUser = args.finished ? 'all' : await args.pick(UserCommand.allOrUser);
		return allOrUser === 'all' ? this.buyList(message, args.t) : this.userList(message, args.t);
	}

	public async onLoad() {
		const { banners } = this.container.db;
		const entries = await banners.find();
		const display = new SkyraPaginatedMessage({ template: new MessageEmbed().setColor(BrandingColors.Primary) });
		for (const banner of entries) {
			UserCommand.banners.set(banner.id, {
				author: banner.authorId,
				authorName: null,
				id: banner.id,
				group: banner.group,
				price: banner.price,
				title: banner.title
			});

			display.addPageEmbed((embed) =>
				embed
					.setImage(`${CDN_URL}${banner.id}.png`)
					.setTitle(banner.title)
					.setDescription(`• ID: \`${banner.id}\`\n• ${banner.price}${Emojis.Shiny}`)
			);
		}

		this.display = display;
	}

	private async buyList(message: GuildMessage, t: TFunction) {
		return this.runDisplay(message, t, this.display.clone());
	}

	private async userList(message: GuildMessage, t: TFunction) {
		const prefix = await readSettings(message.guild, GuildSettings.Prefix);

		const { users } = this.container.db;
		const user = await users.ensureProfile(message.author.id);
		const banners = new Set(user.profile.banners);
		if (!banners.size) this.error(LanguageKeys.Commands.Social.BannerUserListEmpty, { prefix });

		const display = new SkyraPaginatedMessage({ template: new MessageEmbed().setColor(await this.container.db.fetchColor(message)) });
		for (const id of banners) {
			const banner = UserCommand.banners.get(id);
			if (banner) {
				display.addPageEmbed((embed) =>
					embed
						.setImage(`${CDN_URL}${banner.id}.png`)
						.setTitle(banner.title)
						.setDescription(`• ID: \`${banner.id}\`\n• ${banner.price}${Emojis.Shiny}`)
				);
			}
		}

		return this.runDisplay(message, t, display);
	}

	private async runDisplay(message: GuildMessage, t: TFunction, display: SkyraPaginatedMessage) {
		const response = await sendLoadingMessage(message, t);
		await display.run(response, message.author);
		return response;
	}

	private async buyPrompt(message: GuildMessage, banner: BannerCache) {
		const embed = new MessageEmbed()
			.setColor(BrandingColors.Secondary)
			.setDescription([`**Title**: ${banner.title} (\`${banner.id}\`)`, `**Price**: ${banner.price}${Emojis.Shiny}`].join('\n'))
			.setImage(`${CDN_URL}${banner.id}.png`)
			.setTimestamp();

		return promptConfirmation(message, { embeds: [embed] });
	}

	private static readonly banners: Map<string, BannerCache> = new Map();

	private static banner = Args.make<BannerCache>((parameter, { argument, commandContext }) => {
		const banner = UserCommand.banners.get(parameter);
		if (banner) return Args.ok(banner);

		return Args.error({
			parameter,
			argument,
			identifier: LanguageKeys.Commands.Social.BannerNotExists,
			context: { prefix: commandContext.commandPrefix }
		});
	});

	private static allOrUser = Args.make<'all' | 'user'>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		if (lowerCasedParameter === 'all' || lowerCasedParameter === 'user') return Args.ok(lowerCasedParameter);

		return Args.error({ parameter, argument, identifier: LanguageKeys.Commands.Social.BannerAllOrUser });
	});
}

interface BannerCache {
	author: string;
	authorName: null;
	id: string;
	group: string;
	price: number;
	title: string;
}
