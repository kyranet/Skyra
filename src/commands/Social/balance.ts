import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['bal', 'credits'],
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_BALANCE_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_BALANCE_EXTENDED'),
			usage: '[user:username]',
			spam: true
		});
	}

	public async run(message: KlasaMessage, [user = message.author]: [User]) {
		if (user.bot) throw message.language.get('COMMAND_BALANCE_BOTS');

		const { users } = await DbSet.connect();
		const money = (await users.findOne(user.id))?.money ?? 0;

		return message.author === user
			? message.sendLocale('COMMAND_BALANCE_SELF', [{ amount: money }])
			: message.sendLocale('COMMAND_BALANCE', [{ user: user.username, amount: money }]);
	}
}
