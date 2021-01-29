import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { CdnUrls } from '#lib/types/Constants';
import { ApplyOptions } from '@sapphire/decorators';
import { Message, MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Twitch.TwitchDescription,
	extendedHelp: LanguageKeys.Commands.Twitch.TwitchExtended,
	permissions: ['EMBED_LINKS']
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const name = await args.pick('string');
		const { t } = args;

		const { data: channelData } = await this.fetchUsers(t, [name]);
		if (channelData.length === 0) throw t(LanguageKeys.Commands.Twitch.TwitchNoEntries);
		const channel = channelData[0];

		const { total: followersTotal } = await this.context.client.twitch.fetchUserFollowage('', channel.id);

		const titles = t(LanguageKeys.Commands.Twitch.TwitchTitles);
		const affiliateStatus = this.parseAffiliateProgram(t, channel.broadcaster_type);

		return message.send(
			new MessageEmbed()
				.setColor(this.context.client.twitch.BRANDING_COLOUR)
				.setAuthor(channel.display_name, CdnUrls.TwitchLogo, `https://twitch.tv/${channel.login}`)
				.setTitle(titles.clickToVisit)
				.setURL(`https://twitch.tv/${channel.login}`)
				.setDescription(channel.description)
				.setThumbnail(channel.profile_image_url)
				.addField(titles.followers, t(LanguageKeys.Globals.NumberValue, { value: followersTotal }), true)
				.addField(titles.views, t(LanguageKeys.Globals.NumberValue, { value: channel.view_count }), true)
				.addField(titles.partner, affiliateStatus ? affiliateStatus : t(LanguageKeys.Commands.Twitch.TwitchPartnershipWithoutAffiliate))
		);
	}

	private parseAffiliateProgram(t: TFunction, type: 'affiliate' | 'partner' | '') {
		const options = t(LanguageKeys.Commands.Twitch.TwitchAffiliateStatus);
		switch (type) {
			case 'affiliate':
				return options.affiliated;
			case 'partner':
				return options.partnered;
			case '':
			default:
				return false;
		}
	}

	private async fetchUsers(t: TFunction, usernames: string[]) {
		try {
			return await this.context.client.twitch.fetchUsers([], usernames);
		} catch {
			throw t(LanguageKeys.Commands.Twitch.TwitchNoEntries);
		}
	}
}
