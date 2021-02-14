import { GuildSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { Events } from '#lib/types/Enums';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions } from '@sapphire/framework';
import type { Guild, GuildMember, TextChannel, User } from 'discord.js';
import type { TFunction } from 'i18next';

const enum Matches {
	Guild = '%GUILD%',
	Member = '%MEMBER%',
	MemberName = '%MEMBERNAME%',
	MemberTag = '%MEMBERTAG%',
	MemberCount = '%MEMBERCOUNT%',
	Position = '%POSITION%'
}

@ApplyOptions<EventOptions>({ event: Events.NotMutedMemberAdd })
export class UserEvent extends Event {
	private readonly kTransformMessageRegExp = /%MEMBER%|%MEMBERNAME%|%MEMBERTAG%|%GUILD%|%POSITION%|%MEMBERCOUNT%/g;

	public async run(member: GuildMember) {
		const [channelID, content, t] = await member.guild.readSettings((settings) => [
			settings[GuildSettings.Channels.Greeting],
			settings[GuildSettings.Messages.Greeting],
			settings.getLanguage()
		]);

		if (!channelID || !content) return;

		const channel = member.guild.channels.cache.get(channelID) as TextChannel;
		if (channel && channel.postable) {
			return channel.send(this.transformMessage(content, t, member.guild, member.user));
		}

		return member.guild.writeSettings([[GuildSettings.Channels.Greeting, null]]);
	}

	private transformMessage(str: string, t: TFunction, guild: Guild, user: User) {
		return str.replace(this.kTransformMessageRegExp, (match) => {
			switch (match) {
				case Matches.Member:
					return `<@${user.id}>`;
				case Matches.MemberName:
					return user.username;
				case Matches.MemberTag:
					return user.tag;
				case Matches.Guild:
					return guild.name;
				case Matches.Position:
					return t(LanguageKeys.Globals.OrdinalValue, { value: guild.memberCount });
				case Matches.MemberCount:
					return guild.memberCount.toString();
				default:
					return match;
			}
		});
	}
}
