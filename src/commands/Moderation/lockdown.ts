import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { ApplyOptions } from '@skyra/decorators';
import { PreciseTimeout } from '@utils/PreciseTimeout';
import { Permissions, TextChannel } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['lock', 'unlock'],
	cooldown: 5,
	subcommands: true,
	description: (language) => language.get('commandLockdownDescription'),
	extendedHelp: (language) => language.get('commandLockdownExtended'),
	runIn: ['text'],
	usage: '<lock|unlock|auto:default> [target:textchannelname] [duration:timespan]',
	usageDelim: ' ',
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['MANAGE_CHANNELS', 'MANAGE_ROLES']
})
export default class extends SkyraCommand {
	public auto(message: KlasaMessage, [channel = message.channel as TextChannel, duration]: [TextChannel, number?]) {
		return message.guild!.security.lockdowns.has(channel.id) ? this.unlock(message, [channel]) : this.lock(message, [channel, duration]);
	}

	public unlock(message: KlasaMessage, [channel = message.channel as TextChannel]: [TextChannel]) {
		const entry = message.guild!.security.lockdowns.get(channel.id);
		if (typeof entry === 'undefined') throw message.language.get('commandLockdownUnlocked', { channel: channel.toString() });
		return entry.timeout ? entry.timeout.stop() : this._unlock(message, channel);
	}

	public async lock(message: KlasaMessage, [channel = message.channel as TextChannel, duration]: [TextChannel, number?]) {
		// If there was a lockdown, abort lock
		if (message.guild!.security.lockdowns.has(channel.id)) throw message.language.get('commandLockdownLocked', { channel: channel.toString() });

		// Get the role, then check if the user could send messages
		const role = message.guild!.roles.cache.get(message.guild!.id)!;
		const couldSend = channel.permissionsFor(role)?.has(Permissions.FLAGS.SEND_MESSAGES, false) ?? true;
		if (!couldSend) throw message.language.get('commandLockdownLocked', { channel: channel.toString() });

		// If they can send, begin locking
		const response = await message.sendLocale('commandLockdownLocking', [{ channel: channel.toString() }]);
		await channel.updateOverwrite(role, { SEND_MESSAGES: false });
		if (message.channel.postable)
			await response.edit(message.language.get('commandLockdownLock', { channel: channel.toString() })).catch(() => null);

		// Create the timeout
		const timeout = duration ? new PreciseTimeout(duration) : null;
		message.guild!.security.lockdowns.set(channel.id, { timeout });

		// Perform cleanup later
		if (timeout) {
			await timeout.run();
			await this._unlock(message, channel);
		}
	}

	private async _unlock(message: KlasaMessage, channel: TextChannel) {
		channel.guild.security.lockdowns.delete(channel.id);
		await channel.updateOverwrite(channel.guild.id, { SEND_MESSAGES: true });
		return message.sendLocale('commandLockdownOpen', [{ channel: channel.toString() }]);
	}
}
