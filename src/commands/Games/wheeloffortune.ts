import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { Emojis } from '@utils/constants';
import { WheelOfFortune } from '@utils/Games/WheelOfFortune';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['wof'],
	cooldown: 10,
	description: (language) => language.get('commandWheelOfFortuneDescription'),
	extendedHelp: (language) => language.get('commandWheelOfFortuneExtended'),
	requiredPermissions: ['ATTACH_FILES'],
	runIn: ['text'],
	usage: '<wager:wager>'
})
export default class extends SkyraCommand {
	public async run(message: KlasaMessage, [wager]: [number]) {
		const { users } = await DbSet.connect();
		const settings = await users.ensureProfile(message.author.id);
		const balance = settings.money;
		if (balance < wager) {
			throw message.language.get('gamesNotEnoughMoney', { money: balance });
		}

		const [attachment, amount] = await new WheelOfFortune(message, wager, settings).run();
		const titles = message.language.get('commandWheelOfFortuneTitles');

		return message.sendMessage(
			[`**${titles.previous}:** ${balance} ${Emojis.Shiny}`, `**${titles.new}:** ${amount} ${Emojis.Shiny}`].join('\n'),
			{ files: [{ attachment, name: 'wof.png' }] }
		);
	}
}
