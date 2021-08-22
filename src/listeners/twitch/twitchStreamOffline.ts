import { LanguageKeys } from '#lib/i18n/languageKeys';
import { TwitchEventSubEvent, TwitchEventSubTypes } from '#lib/types';
import { Events } from '#lib/types/Enums';
import { floatPromise } from '#utils/common';
import { ApplyOptions } from '@sapphire/decorators';
import { canSendMessages, TextBasedChannelTypes } from '@sapphire/discord.js-utilities';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { fetchT } from '@sapphire/plugin-i18next';
import { isNullish } from '@sapphire/utilities';
import { MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<ListenerOptions>({
	event: Events.TwitchStreamOffline
})
export class UserListener extends Listener<Events.TwitchStreamOffline> {
	public async run(data: TwitchEventSubEvent) {
		const { twitchSubscriptions } = this.container.db;

		const twitchSubscription = await twitchSubscriptions.findOne({
			relations: ['guildSubscription'],
			where: {
				streamerId: data.broadcaster_user_id,
				subscriptionType: TwitchEventSubTypes.StreamOffline
			}
		});

		if (twitchSubscription) {
			// Iterate over all the guilds that are subscribed to this streamer and subscription type
			for (const guildSubscription of twitchSubscription.guildSubscription) {
				if (
					this.container.client.twitch.streamNotificationDrip(
						`${twitchSubscription.streamerId}-${guildSubscription.channelId}-${TwitchEventSubTypes.StreamOffline}`
					)
				) {
					continue;
				}

				// Retrieve the guild, if not found, skip to the next loop cycle.
				const guild = this.container.client.guilds.cache.get(guildSubscription.guildId);
				if (typeof guild === 'undefined') continue;

				// Retrieve the language for this guild
				const t = await fetchT(guild);

				// Retrieve the channel to send the message to
				const channel = guild.channels.cache.get(guildSubscription.channelId) as TextBasedChannelTypes;
				if (isNullish(channel) || !canSendMessages(channel)) {
					continue;
				}

				// Construct a message embed and send it.
				// If the message could not be retrieved then skip this notification.
				if (guildSubscription.message) {
					floatPromise(channel.send({ embeds: [this.buildEmbed(guildSubscription.message, t)] }));
				}
			}
		}
	}

	private buildEmbed(message: string, t: TFunction) {
		return new MessageEmbed()
			.setColor(this.container.client.twitch.BRANDING_COLOUR)
			.setDescription(message)
			.setFooter(t(LanguageKeys.Events.Twitch.EmbedFooter))
			.setTimestamp();
	}
}
