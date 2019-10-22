import { Event, Settings } from 'klasa';
import { GuildSettings } from '../lib/types/settings/GuildSettings';
import { SkyraGuild } from '../lib/extensions/SkyraGuild';

export default class extends Event {

	public async run(settings: Settings) {
		// If the synchronized settings isn't from the guilds gateway, return early.
		if (settings.gateway.name !== 'guilds') return;

		const guild = settings.target as SkyraGuild;
		this.updateFilter(guild, settings);
		await this.updatePermissionNodes(guild);
	}

	private updateFilter(guild: SkyraGuild, settings: Settings) {
		const blockedWords = settings.get(GuildSettings.Selfmod.Filter.Raw) as readonly string[];

		if (blockedWords.length) guild!.security.updateRegExp(blockedWords);
		else guild!.security.regexp = null;
	}

	private updatePermissionNodes(guild: SkyraGuild) {
		return guild.permissionsManager.update();
	}

}
