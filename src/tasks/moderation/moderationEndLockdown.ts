import { LockdownType, Task, type LockdownData } from '#lib/schedule';
import { getLogPrefix } from '#utils/functions';
import { Result } from '@sapphire/framework';
import { isNullish } from '@sapphire/utilities';
import {
	DiscordAPIError,
	HTTPError,
	PermissionFlagsBits,
	RESTJSONErrorCodes,
	type AnyThreadChannel,
	type CategoryChannel,
	type ForumChannel,
	type Guild,
	type MediaChannel,
	type NewsChannel,
	type PrivateThreadChannel,
	type PublicThreadChannel,
	type Snowflake,
	type StageChannel,
	type TextChannel,
	type VoiceChannel
} from 'discord.js';

const LockdownPermissions = PermissionFlagsBits.SendMessages | PermissionFlagsBits.SendMessagesInThreads;
const IgnoredChannelErrors = [RESTJSONErrorCodes.UnknownGuild, RESTJSONErrorCodes.UnknownRole, RESTJSONErrorCodes.UnknownChannel];
const IgnoredGuildErrors = [RESTJSONErrorCodes.UnknownGuild, RESTJSONErrorCodes.UnknownRole];

export class UserTask extends Task {
	public override run(data: LockdownData) {
		const guild = this.container.client.guilds.cache.get(data.guildId);
		if (isNullish(guild)) return this.finish();

		return data.type === LockdownType.Guild //
			? this.#unlockGuild(guild, data.roleId)
			: data.type === LockdownType.Channel
				? this.#unlockChannel(guild, data.roleId, data.channelId)
				: this.#unlockChannel(guild, null, data.channelId);
	}

	async #unlockChannel(guild: Guild, roleId: Snowflake | null, channelId: Snowflake) {
		const channel = guild.channels.cache.get(channelId);
		if (isNullish(channel)) return this.finish();

		const me = await guild.members.fetchMe();
		// If the bot cannot manage channels, ignore:
		if (!me.permissions.has(PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles)) return this.finish();

		return channel.isThread() //
			? this.#unlockChannelThread(channel)
			: this.#unlockChannelNonThread(channel, roleId!);
	}

	async #unlockChannelNonThread(channel: SupportedNonThreadChannel, roleId: Snowflake) {
		const role = channel.guild.roles.cache.get(roleId);
		if (isNullish(role)) return this.finish();

		// If the permissions have been restored, ignore:
		if (channel.permissionsFor(role).has(LockdownPermissions)) return this.finish();

		// If the bot cannot manage the channel, ignore:
		if (!channel.manageable) return this.finish();

		const result = await Result.fromAsync(channel.permissionOverwrites.edit(role, { SendMessages: false, SendMessagesInThreads: false }));
		return result.match({
			ok: () => this.finish(),
			err: (error) => this.#unlockChannelError(error as Error)
		});
	}

	async #unlockChannelThread(channel: SupportedThreadChannel) {
		// If the thread is not locked, ignore:
		if (!channel.locked) return this.finish();

		// If the bot cannot manage the thread, ignore:
		if (!channel.manageable) return this.finish();

		const result = await Result.fromAsync(channel.setLocked(true));
		return result.match({
			ok: () => this.finish(),
			err: (error) => this.#unlockChannelError(error as Error)
		});
	}

	#unlockChannelError(error: Error) {
		// If the error is an AbortError, delay for 5 seconds:
		if (error.name === 'AbortError') return this.delay(5000);
		// If the error is an HTTPError, delay for 30 seconds:
		if (error instanceof HTTPError) return this.delay(30000);
		// If the error is an UnknownChannel error, ignore:
		if (error instanceof DiscordAPIError && IgnoredChannelErrors.includes(error.code as number)) return this.finish();
		// Otherwise, emit the error:
		this.container.logger.error(getLogPrefix(this), error);
		return this.finish();
	}

	async #unlockGuild(guild: Guild, roleId: Snowflake) {
		const role = guild.roles.cache.get(roleId);
		if (isNullish(role)) return this.finish();

		// If the permissions have been restored, ignore:
		if (role.permissions.has(LockdownPermissions)) return this.finish();

		const me = await guild.members.fetchMe();
		// If the bot cannot manage roles, ignore:
		if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return this.finish();

		const result = await Result.fromAsync(role.setPermissions(role.permissions.bitfield | LockdownPermissions));
		return result.match({
			ok: () => this.finish(),
			err: (error) => this.#unlockGuildError(error as Error)
		});
	}

	#unlockGuildError(error: Error) {
		// If the error is an AbortError, delay for 5 seconds:
		if (error.name === 'AbortError') return this.delay(5000);
		// If the error is an HTTPError, delay for 30 seconds:
		if (error instanceof HTTPError) return this.delay(30000);
		// If the error is an UnknownChannel error, ignore:
		if (error instanceof DiscordAPIError && IgnoredGuildErrors.includes(error.code as number)) return this.finish();
		// Otherwise, emit the error:
		this.container.logger.error(getLogPrefix(this), error);
		return this.finish();
	}
}

type SupportedChannel =
	| CategoryChannel
	| NewsChannel
	| StageChannel
	| TextChannel
	| PrivateThreadChannel
	| PublicThreadChannel<boolean>
	| VoiceChannel
	| ForumChannel
	| MediaChannel;
type SupportedThreadChannel = AnyThreadChannel<boolean>;
type SupportedNonThreadChannel = Exclude<SupportedChannel, SupportedThreadChannel>;
