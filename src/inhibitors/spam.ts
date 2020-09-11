import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { Inhibitor, KlasaMessage, RateLimitManager } from 'klasa';

export default class extends Inhibitor {
	public spamProtection = true;

	private readonly ratelimit = new RateLimitManager(1, 30000);

	public async run(message: KlasaMessage, command: SkyraCommand) {
		if (!command.spam || !message.guild) return;

		const channelID = message.guild.settings.get(GuildSettings.Channels.Spam);
		if (channelID === message.channel.id) return;
		if (await message.hasAtLeastPermissionLevel(5)) return;

		const channel = message.guild.channels.cache.get(channelID);
		if (!channel) {
			await message.guild.settings.reset(GuildSettings.Channels.Spam);
			return;
		}

		try {
			this.ratelimit.acquire(message.channel.id).drip();
		} catch {
			throw message.language.get('inhibitorSpam', { channel: channel.toString() });
		}
	}
}
