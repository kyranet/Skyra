import { GuildSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { Colors } from '#lib/types/Constants';
import { difference } from '#utils/comparators';
import { ApplyOptions } from '@sapphire/decorators';
import { Event, EventOptions, Events } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import { GuildEmoji, MessageEmbed, TextChannel } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<EventOptions>({ event: Events.EmojiUpdate })
export class UserEvent extends Event<Events.EmojiUpdate> {
	public async run(previous: GuildEmoji, next: GuildEmoji) {
		const [channelID, t] = await next.guild.readSettings((settings) => [
			settings[GuildSettings.Channels.Logs.EmojiUpdate],
			settings.getLanguage()
		]);
		if (isNullish(channelID)) return;

		const channel = next.guild.channels.cache.get(channelID) as TextChannel | undefined;
		if (channel === undefined) {
			await next.guild.writeSettings([[GuildSettings.Channels.Logs.EmojiUpdate, null]]);
			return;
		}

		const changes: string[] = [...this.differenceEmoji(t, previous, next)];
		if (changes.length === 0) return;

		await channel.send(
			new MessageEmbed()
				.setColor(Colors.Yellow)
				.setTitle(t(LanguageKeys.Events.Guilds.Logs.EmojiUpdate))
				.setDescription(changes.join('\n'))
				.setTimestamp()
		);
	}

	private *differenceEmoji(t: TFunction, previous: GuildEmoji, next: GuildEmoji) {
		const [no, yes] = [t(LanguageKeys.Globals.No), t(LanguageKeys.Globals.Yes)];

		if (previous.animated !== next.animated) {
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateAnimated, {
				previous: previous.animated ? yes : no,
				next: next.animated ? yes : no
			});
		}

		if (previous.available !== next.available) {
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateAvailable, {
				previous: previous.available ? yes : no,
				next: next.available ? yes : no
			});
		}

		if (previous.managed !== next.managed) {
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateManaged, {
				previous: previous.managed ? yes : no,
				next: next.managed ? yes : no
			});
		}

		if (previous.name !== next.name) {
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateName, {
				previous: previous.name,
				next: next.name
			});
		}

		if (previous.requiresColons !== next.requiresColons) {
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateRequiresColons, {
				previous: previous.requiresColons ? yes : no,
				next: next.requiresColons ? yes : no
			});
		}

		const modified = difference(previous.roles.cache, next.roles.cache);
		if (modified.added.size !== 0) {
			const roles = [...modified.added.keys()].map((id) => `<@&${id}>`);
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateRolesAdded, { roles, count: roles.length });
		}

		if (modified.removed.size !== 0) {
			const roles = [...modified.removed.keys()].map((id) => `<@&${id}>`);
			yield t(LanguageKeys.Events.Guilds.Logs.EmojiUpdateRolesRemoved, { roles, count: roles.length });
		}
	}
}
