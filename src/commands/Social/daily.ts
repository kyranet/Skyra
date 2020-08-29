import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ClientEntity } from '@orm/entities/ClientEntity';
import { UserEntity } from '@orm/entities/UserEntity';
import { ApplyOptions } from '@skyra/decorators';
import { Time } from '@utils/constants';
import { KlasaMessage } from 'klasa';
import { Schedules } from '@lib/types/Enums';

const GRACE_PERIOD = Time.Hour;
const DAILY_PERIOD = Time.Hour * 12;

const REMINDER_FLAGS = ['remind', 'reminder', 'remindme'];

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['dailies'],
	cooldown: 30,
	description: (language) => language.get('commandDailyDescription'),
	extendedHelp: (language) => language.get('commandDailyExtended'),
	spam: true,
	flagSupport: true
})
export default class extends SkyraCommand {
	public async run(message: KlasaMessage) {
		const now = Date.now();

		const connection = await DbSet.connect();
		return connection.users.lock([message.author.id], async (id) => {
			const settings = await connection.users.ensureCooldowns(id);

			const toRemind = REMINDER_FLAGS.some((flag) => Reflect.has(message.flagArgs, flag));

			// It's been 12 hours, grant dailies
			if (!settings.cooldowns.daily || settings.cooldowns.daily.getTime() <= now) {
				return message.sendLocale('commandDailyTimeSuccess', [
					{
						amount: await this.claimDaily(message, connection, settings, now + DAILY_PERIOD, toRemind)
					}
				]);
			}

			const remaining = settings.cooldowns.daily.getTime() - now;

			// If it's not under the grace period (1 hour), tell them the time
			if (remaining > GRACE_PERIOD) return message.sendLocale('commandDailyTime', [{ time: remaining }]);

			// It's been 11-12 hours, ask for the user if they want to claim the grace period
			const accepted = await message.ask(message.language.get('commandDailyGrace', { remaining }));
			if (!accepted) return message.sendLocale('commandDailyGraceDenied');

			// The user accepted the grace period
			return message.sendLocale('commandDailyGraceAccepted', [
				{
					amount: await this.claimDaily(message, connection, settings, now + remaining + DAILY_PERIOD, toRemind),
					remaining: remaining + DAILY_PERIOD
				}
			]);
		});
	}

	private async claimDaily(message: KlasaMessage, connection: DbSet, settings: UserEntity, nextTime: number, remind: boolean) {
		const money = this.calculateDailies(message, await connection.clients.ensure(), settings);

		settings.money += money;
		settings.cooldowns!.daily = new Date(nextTime);
		await settings.save();

		if (remind) {
			await this.client.schedules.add(Schedules.Reminder, nextTime, {
				data: {
					content: message.language.get('commandDailyCollect'),
					user: message.author.id
				}
			});
		}

		return money;
	}

	private calculateDailies(message: KlasaMessage, client: ClientEntity, user: UserEntity) {
		let money = 200;
		if (client.userBoost.includes(user.id)) money *= 1.5;
		if (message.guild && client.guildBoost.includes(message.guild.id)) money *= 1.5;
		return money;
	}
}
