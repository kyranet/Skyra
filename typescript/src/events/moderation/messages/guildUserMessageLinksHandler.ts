import { GuildSettings, readSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { ModerationMessageEvent } from '#lib/moderation';
import type { GuildMessage } from '#lib/types';
import { Colors } from '#lib/types/Constants';
import { urlRegex } from '#utils/Links/UrlRegex';
import { ApplyOptions } from '@sapphire/decorators';
import { MessageEmbed, TextChannel } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<ModerationMessageEvent.Options>({
	reasonLanguageKey: LanguageKeys.Events.Moderation.Messages.ModerationLinks,
	reasonLanguageKeyWithMaximum: LanguageKeys.Events.Moderation.Messages.ModerationLinksWithMaximum,
	keyEnabled: GuildSettings.Selfmod.Links.Enabled,
	ignoredChannelsPath: GuildSettings.Selfmod.Links.IgnoredChannels,
	ignoredRolesPath: GuildSettings.Selfmod.Links.IgnoredRoles,
	softPunishmentPath: GuildSettings.Selfmod.Links.SoftAction,
	hardPunishmentPath: {
		action: GuildSettings.Selfmod.Links.HardAction,
		actionDuration: GuildSettings.Selfmod.Links.HardActionDuration,
		adder: 'links'
	}
})
export class UserModerationMessageEvent extends ModerationMessageEvent {
	private readonly kRegExp = urlRegex({ requireProtocol: true, tlds: true });
	private readonly kAllowedDomains = /^(?:\w+\.)?(?:discordapp.com|discord.gg|discord.com)$/i;

	protected async preProcess(message: GuildMessage): Promise<1 | null> {
		if (message.content.length === 0) return null;

		let match: RegExpExecArray | null = null;

		const allowed = await readSettings(message.guild, GuildSettings.Selfmod.Links.Allowed);
		while ((match = this.kRegExp.exec(message.content)) !== null) {
			const { hostname } = match.groups!;
			if (this.kAllowedDomains.test(hostname)) continue;
			if (allowed.includes(hostname)) continue;
			return 1;
		}

		return null;
	}

	protected onDelete(message: GuildMessage) {
		return message.nuke();
	}

	protected onAlert(message: GuildMessage, t: TFunction) {
		return message.alert(t(LanguageKeys.Events.Moderation.Messages.LinkMissing, { user: message.author.toString() }));
	}

	protected onLogMessage(message: GuildMessage, t: TFunction) {
		return new MessageEmbed()
			.setColor(Colors.Red)
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setFooter(`#${(message.channel as TextChannel).name} | ${t(LanguageKeys.Events.Moderation.Messages.LinkFooter)}`)
			.setTimestamp();
	}
}
