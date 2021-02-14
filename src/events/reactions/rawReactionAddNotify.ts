import { GuildSettings } from '#lib/database';
import { api } from '#lib/discord/Api';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { Colors } from '#lib/types/Constants';
import { Events } from '#lib/types/Enums';
import { MessageLogsEnum } from '#utils/constants';
import type { LLRCData } from '#utils/LongLivingReactionCollector';
import { twemoji } from '#utils/util';
import Collection from '@discordjs/collection';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions } from '@sapphire/framework';
import type { APIUser } from 'discord-api-types/v6';
import { MessageEmbed } from 'discord.js';

@ApplyOptions<EventOptions>({ event: Events.RawReactionAdd })
export class UserEvent extends Event {
	private readonly kCountCache = new Collection<string, InternalCacheEntry>();
	private readonly kSyncCache = new Collection<string, Promise<InternalCacheEntry>>();
	private kTimerSweeper: NodeJS.Timer | null = null;

	public async run(data: LLRCData, emoji: string) {
		const [
			allowList,
			channel,
			twemojiEnabled,
			ignoreChannels,
			ignoreReactionAdd,
			ignoreAllEvents,
			t
		] = await data.guild.readSettings((settings) => [
			settings[GuildSettings.Selfmod.Reactions.WhiteList],
			settings[GuildSettings.Channels.ReactionLogs],
			settings[GuildSettings.Events.Twemoji],
			settings[GuildSettings.Messages.IgnoreChannels],
			settings[GuildSettings.Channels.Ignore.ReactionAdd],
			settings[GuildSettings.Channels.Ignore.All],
			settings.getLanguage()
		]);

		if (allowList.includes(emoji)) return;

		this.context.client.emit(Events.ReactionBlacklist, data, emoji);
		if (!channel || (!twemojiEnabled && data.emoji.id === null)) return;

		if (ignoreChannels.includes(data.channel.id)) return;
		if (ignoreReactionAdd.some((id) => id === data.channel.id || data.channel.parentID === id)) return;
		if (ignoreAllEvents.some((id) => id === data.channel.id || data.channel.parentID === id)) return;

		if ((await this.retrieveCount(data, emoji)) > 1) return;

		const user = await this.context.client.users.fetch(data.userID);
		if (user.bot) return;

		this.context.client.emit(Events.GuildMessageLog, MessageLogsEnum.Reaction, data.guild, () =>
			new MessageEmbed()
				.setColor(Colors.Green)
				.setAuthor(`${user.tag} (${user.id})`, user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
				.setThumbnail(
					data.emoji.id === null
						? `https://twemoji.maxcdn.com/72x72/${twemoji(data.emoji.name!)}.png`
						: `https://cdn.discordapp.com/emojis/${data.emoji.id}.${data.emoji.animated ? 'gif' : 'png'}?size=64`
				)
				.setDescription(
					[
						`**Emoji**: ${data.emoji.name}${data.emoji.id === null ? '' : ` [${data.emoji.id}]`}`,
						`**Channel**: ${data.channel}`,
						`**Message**: [${t(LanguageKeys.Misc.JumpTo)}](https://discord.com/channels/${data.guild.id}/${data.channel.id}/${
							data.messageID
						})`
					].join('\n')
				)
				.setFooter(`${t(LanguageKeys.Events.Reactions.Reaction)} • ${data.channel.name}`)
				.setTimestamp()
		);
	}

	protected async retrieveCount(data: LLRCData, emoji: string) {
		const id = `${data.messageID}.${emoji}`;

		// Pull from sync queue, and if it exists, await
		const sync = this.kSyncCache.get(id);
		if (typeof sync !== 'undefined') await sync;

		// Retrieve the reaction count
		const previousCount = this.kCountCache.get(id);
		if (typeof previousCount !== 'undefined') {
			previousCount.count++;
			previousCount.sweepAt = Date.now() + 120000;
			return previousCount.count;
		}

		// Pull the reactions from the API
		const promise = this.fetchCount(data, emoji, id);
		this.kSyncCache.set(id, promise);
		return (await promise).count;
	}

	private async fetchCount(data: LLRCData, emoji: string, id: string) {
		const users = (await api().channels(data.channel.id).messages(data.messageID).reactions(emoji).get()) as APIUser[];
		const count: InternalCacheEntry = { count: users.length, sweepAt: Date.now() + 120000 };
		this.kCountCache.set(id, count);
		this.kSyncCache.delete(id);

		if (this.kTimerSweeper === null) {
			this.kTimerSweeper = this.context.client.setInterval(() => {
				const now = Date.now();
				this.kCountCache.sweep((entry) => entry.sweepAt < now);
				if (this.kTimerSweeper !== null && this.kCountCache.size === 0) {
					this.context.client.clearInterval(this.kTimerSweeper);
					this.kTimerSweeper = null;
				}
			}, 5000);
		}

		return count;
	}
}

interface InternalCacheEntry {
	sweepAt: number;
	count: number;
}
