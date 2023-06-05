import { GuildEntity, readSettings } from '#lib/database';
import { seconds } from '#utils/common';
import { getModeration, getSecurity } from '#utils/functions';
import { Listener } from '@sapphire/framework';
import type { PickByValue } from '@sapphire/utilities';
import type { Guild, MessageEmbed } from 'discord.js';
import type { HardPunishment } from './ModerationMessageListener';
import { SelfModeratorBitField, SelfModeratorHardActionFlags } from './SelfModeratorBitField';

export abstract class ModerationListener<V extends unknown[], T = unknown> extends Listener {
	public abstract run(...params: V): unknown;

	protected processSoftPunishment(args: Readonly<V>, preProcessed: T, bitField: SelfModeratorBitField) {
		if (bitField.has(SelfModeratorBitField.FLAGS.DELETE)) this.onDelete(args, preProcessed);
		if (bitField.has(SelfModeratorBitField.FLAGS.ALERT)) this.onAlert(args, preProcessed);
		if (bitField.has(SelfModeratorBitField.FLAGS.LOG)) this.onLog(args, preProcessed);
	}

	protected async processHardPunishment(guild: Guild, userId: string, action: SelfModeratorHardActionFlags) {
		switch (action) {
			case SelfModeratorHardActionFlags.Warning:
				await this.onWarning(guild, userId);
				break;
			case SelfModeratorHardActionFlags.Kick:
				await this.onKick(guild, userId);
				break;
			case SelfModeratorHardActionFlags.Mute:
				await this.onMute(guild, userId);
				break;
			case SelfModeratorHardActionFlags.SoftBan:
				await this.onSoftBan(guild, userId);
				break;
			case SelfModeratorHardActionFlags.Ban:
				await this.onBan(guild, userId);
				break;
			case SelfModeratorHardActionFlags.None:
				break;
		}
	}

	protected async onWarning(guild: Guild, userId: string) {
		const duration = await readSettings(guild, this.hardPunishmentPath.actionDuration);
		await this.createActionAndSend(guild, () =>
			getSecurity(guild).actions.warning({
				userId,
				moderatorId: process.env.CLIENT_ID,
				reason: '[Auto-Moderation] Threshold Reached.',
				duration
			})
		);
	}

	protected async onKick(guild: Guild, userId: string) {
		await this.createActionAndSend(guild, () =>
			getSecurity(guild).actions.kick({
				userId,
				moderatorId: process.env.CLIENT_ID,
				reason: '[Auto-Moderation] Threshold Reached.'
			})
		);
	}

	protected async onMute(guild: Guild, userId: string) {
		const duration = await readSettings(guild, this.hardPunishmentPath.actionDuration);
		await this.createActionAndSend(guild, () =>
			getSecurity(guild).actions.mute({
				userId,
				moderatorId: process.env.CLIENT_ID,
				reason: '[Auto-Moderation] Threshold Reached.',
				duration
			})
		);
	}

	protected async onSoftBan(guild: Guild, userId: string) {
		await this.createActionAndSend(guild, () =>
			getSecurity(guild).actions.softBan(
				{
					userId,
					moderatorId: process.env.CLIENT_ID,
					reason: '[Auto-Moderation] Threshold Reached.'
				},
				seconds.fromMinutes(5)
			)
		);
	}

	protected async onBan(guild: Guild, userId: string) {
		const duration = await readSettings(guild, this.hardPunishmentPath.actionDuration);

		await this.createActionAndSend(guild, () =>
			getSecurity(guild).actions.ban({
				userId,
				moderatorId: process.env.CLIENT_ID,
				reason: '[Auto-Moderation] Threshold Reached.',
				duration
			})
		);
	}

	protected async createActionAndSend(guild: Guild, performAction: () => unknown): Promise<void> {
		const unlock = getModeration(guild).createLock();
		await performAction();
		unlock();
	}

	protected abstract keyEnabled: PickByValue<GuildEntity, boolean>;
	protected abstract softPunishmentPath: PickByValue<GuildEntity, number>;
	protected abstract hardPunishmentPath: HardPunishment;
	protected abstract preProcess(args: Readonly<V>): Promise<T | null> | T | null;
	protected abstract onLog(args: Readonly<V>, value: T): unknown;
	protected abstract onDelete(args: Readonly<V>, value: T): unknown;
	protected abstract onAlert(args: Readonly<V>, value: T): unknown;
	protected abstract onLogMessage(args: Readonly<V>, value: T): Promise<MessageEmbed> | MessageEmbed;
}
