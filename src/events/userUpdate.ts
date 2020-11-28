import { GuildSettings } from '#lib/database/index';
import { filter, map } from '#lib/misc/index';
import { Colors } from '#lib/types/constants/Constants';
import { Events } from '#lib/types/Enums';
import { CustomGet } from '#lib/types/index';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { MessageLogsEnum } from '#utils/constants';
import { Guild, MessageEmbed, User } from 'discord.js';
import { Event, Language } from 'klasa';

export default class extends Event {
	public async run(previous: User, user: User) {
		const prevUsername = previous.username;
		const nextUserName = user.username;
		if (prevUsername === nextUserName) return;

		const promises = [
			...map(
				filter(this.client.guilds.cache.values(), (guild) => guild.members.cache.has(user.id)),
				(guild) => this.processGuild(guild, user, prevUsername, nextUserName)
			)
		];
		if (promises.length) await Promise.all(promises);
	}

	private async processGuild(guild: Guild, user: User, previous: string, next: string) {
		const [enabled, language] = await guild.readSettings((settings) => [
			settings[GuildSettings.Events.MemberNicknameUpdate],
			settings.getLanguage()
		]);

		if (enabled) {
			// Send the Username log
			this.client.emit(Events.GuildMessageLog, MessageLogsEnum.Member, guild, () =>
				this.buildEmbed(user, language, this.getNameDescription(language, previous, next), LanguageKeys.Events.UsernameUpdate)
			);
		}
	}

	private getNameDescription(i18n: Language, previousName: string | null, nextName: string | null) {
		const previous = previousName === null ? LanguageKeys.Events.NameUpdatePreviousWasNotSet : LanguageKeys.Events.NameUpdatePreviousWasSet;
		const next = nextName === null ? LanguageKeys.Events.NameUpdateNextWasNotSet : LanguageKeys.Events.NameUpdateNextWasSet;
		return [i18n.get(previous, { previousName }), i18n.get(next, { nextName })].join('\n');
	}

	private buildEmbed(user: User, i18n: Language, description: string, footerKey: CustomGet<string, string>) {
		return new MessageEmbed()
			.setColor(Colors.Yellow)
			.setAuthor(`${user.tag} (${user.id})`, user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setDescription(description)
			.setFooter(i18n.get(footerKey))
			.setTimestamp();
	}
}
