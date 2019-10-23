import { CommandOptions, CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { ApplyOptions } from '../../lib/util/util';

const YEAR = 1000 * 60 * 60 * 24 * 365;

@ApplyOptions<CommandOptions>({
	aliases: ['giveawayschedule', 'gs', 'gc'],
	description: language => language.tget('COMMAND_GIVEAWAYSCHEDULE_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_GIVEAWAYSCHEDULE_EXTENDED'),
	requiredPermissions: ['EMBED_LINKS', 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
	runIn: ['text'],
	usage: '<schedule:time> <duration:timespan> <title:...string{,256}>',
	usageDelim: ' ',
	promptLimit: Infinity
})
export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {

		});
	}

	public async run(message: KlasaMessage, [schedule, duration, title]: [Date, number, string]) {
		// First do the checks for the giveaway itself
		const scheduleOffset = schedule.getTime() - Date.now();

		if (duration < 9500 || scheduleOffset < 9500) throw message.language.tget('GIVEAWAY_TIME');
		if (duration > YEAR || scheduleOffset > YEAR) throw message.language.tget('GIVEAWAY_TIME_TOO_LONG');

		// This creates an single time task to start the giveaway
		await this.client.schedule.create('giveaway', schedule.getTime(), {
			data: {
				channelID: message.channel.id,
				endsAt: duration,
				guildID: message.guild!.id,
				minimum: 1,
				minimumWinners: 1,
				title
			},
			catchUp: true
		});

		return message.sendLocale('GIVEAWAY_SCHEDULED', [schedule, duration, title]);
	}

}
