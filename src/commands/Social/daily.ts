import { ClientEntity, DbSet, UserEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { Schedules } from '#lib/types/Enums';
import { Time } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';
import type { TFunction } from 'i18next';

const GRACE_PERIOD = Time.Hour;
const DAILY_PERIOD = Time.Hour * 12;

const REMINDER_FLAGS = ['remind', 'reminder', 'remindme'];

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['dailies'],
	cooldown: 30,
	description: LanguageKeys.Commands.Social.DailyDescription,
	extendedHelp: LanguageKeys.Commands.Social.DailyExtended,
	spam: true,
	strategyOptions: { flags: REMINDER_FLAGS }
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const toRemind = args.getFlags(...REMINDER_FLAGS);
		const now = Date.now();

		const connection = await DbSet.connect();
		return connection.users.lock([message.author.id], async (id) => {
			const settings = await connection.users.ensureCooldowns(id);

			// It's been 12 hours, grant dailies
			if (!settings.cooldowns.daily || settings.cooldowns.daily.getTime() <= now) {
				return message.send(
					args.t(LanguageKeys.Commands.Social.DailyTimeSuccess, {
						amount: await this.claimDaily(message, args.t, connection, settings, now + DAILY_PERIOD, toRemind)
					})
				);
			}

			const remaining = settings.cooldowns.daily.getTime() - now;

			// If it's not under the grace period (1 hour), tell them the time
			if (remaining > GRACE_PERIOD) return message.send(args.t(LanguageKeys.Commands.Social.DailyTime, { time: remaining }));

			// It's been 11-12 hours, ask for the user if they want to claim the grace period
			const accepted = await message.ask(args.t(LanguageKeys.Commands.Social.DailyGrace, { remaining }));
			if (!accepted) return message.send(args.t(LanguageKeys.Commands.Social.DailyGraceDenied));

			// The user accepted the grace period
			return message.send(
				args.t(LanguageKeys.Commands.Social.DailyGraceAccepted, {
					amount: await this.claimDaily(message, args.t, connection, settings, now + remaining + DAILY_PERIOD, toRemind),
					remaining: remaining + DAILY_PERIOD
				})
			);
		});
	}

	private async claimDaily(message: Message, t: TFunction, connection: DbSet, settings: UserEntity, nextTime: number, remind: boolean) {
		const money = this.calculateDailies(message, await connection.clients.ensure(), settings);

		settings.money += money;
		settings.cooldowns!.daily = new Date(nextTime);
		await settings.save();

		if (remind) {
			await this.context.client.schedules.add(Schedules.Reminder, nextTime, {
				data: {
					content: t(LanguageKeys.Commands.Social.DailyCollect),
					user: message.author.id
				}
			});
		}

		return money;
	}

	private calculateDailies(message: Message, client: ClientEntity, user: UserEntity) {
		let money = 200;
		if (client.userBoost.includes(user.id)) money *= 1.5;
		if (message.guild && client.guildBoost.includes(message.guild.id)) money *= 1.5;
		return money;
	}
}
