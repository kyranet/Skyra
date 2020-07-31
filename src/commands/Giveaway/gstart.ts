import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions, CreateResolvers } from '@skyra/decorators';
import { Time } from '@utils/constants';
import { cleanMentions } from '@utils/util';
import { TextChannel } from 'discord.js';
import { KlasaMessage } from 'klasa';

const kWinnersArgRegex = /^([1-9]|\d\d+)w$/i;

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['giveaway'],
	description: language => language.tget('COMMAND_GIVEAWAY_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_GIVEAWAY_EXTENDED'),
	requiredPermissions: ['EMBED_LINKS', 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
	runIn: ['text'],
	usage: '[channel:textchannelname{2}] <time:time> [winners:winners] <title:...string{,256}>',
	flagSupport: true,
	usageDelim: ' '
})
@CreateResolvers([
	[
		'winners', arg => {
			const match = kWinnersArgRegex.exec(arg);
			if (match) return parseInt(match[1], 10);
			throw 'Invalid winners value.';
		}
	]
])
export default class extends SkyraCommand {

	public async run(message: KlasaMessage, [channel = message.channel as TextChannel, time, winners, title]: [TextChannel, Date, number, string]) {
		const offset = time.getTime() - Date.now();

		if (offset < 9500) throw message.language.tget('GIVEAWAY_TIME');
		if (offset > Time.Year) throw message.language.tget('GIVEAWAY_TIME_TOO_LONG');

		await this.client.giveaways.create({
			channelID: channel.id,
			endsAt: new Date(time.getTime() + 500),
			guildID: message.guild!.id,
			minimum: 1,
			minimumWinners: winners,
			title: cleanMentions(message.guild!, title)
		});
	}

}
