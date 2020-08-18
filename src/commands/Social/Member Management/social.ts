import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { MemberEntity } from '@orm/entities/MemberEntity';
import { Time } from '@utils/constants';
import { User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SOCIAL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SOCIAL_EXTENDED'),
			permissionLevel: PermissionLevels.Administrator,
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|set|reset> <user:username> (amount:money{0,1000000})',
			usageDelim: ' '
		});

		this.createCustomResolver('money', (arg, possible, message, [type]) => {
			if (type === 'reset') return null;
			return this.client.arguments.get('integer')!.run(arg, possible, message);
		});
	}

	public async add(message: KlasaMessage, [user, amount]: [User, number]) {
		const { members } = await DbSet.connect();
		const settings = await members.findOne({ where: { userID: user.id, guildID: message.guild!.id }, cache: Time.Minute * 15 });
		if (settings) {
			const newAmount = settings.points + amount;
			settings.points = newAmount;
			await settings.save();

			return message.sendLocale('COMMAND_SOCIAL_ADD', [{ user: user.username, amount: newAmount, added: amount }]);
		}

		const created = new MemberEntity();
		created.userID = user.id;
		created.guildID = message.guild!.id;
		created.points = amount;
		await members.insert(created);

		return message.sendLocale('COMMAND_SOCIAL_ADD', [{ user: user.username, amount, added: amount }]);
	}

	public async remove(message: KlasaMessage, [user, amount]: [User, number]) {
		const { members } = await DbSet.connect();
		const settings = await members.findOne({ where: { userID: user.id, guildID: message.guild!.id }, cache: Time.Minute * 15 });
		if (!settings) throw message.language.get('COMMAND_SOCIAL_MEMBER_NOTEXISTS');

		const newAmount = Math.max(settings.points - amount, 0);
		settings.points = newAmount;
		await settings.save();

		return message.sendLocale('COMMAND_SOCIAL_REMOVE', [{ user: user.username, amount: newAmount, removed: amount }]);
	}

	public async set(message: KlasaMessage, [user, amount]: [User, number]) {
		// If sets to zero, it shall reset
		if (amount === 0) return this.reset(message, [user]);

		const { members } = await DbSet.connect();
		const settings = await members.findOne({ where: { userID: user.id, guildID: message.guild!.id }, cache: Time.Minute * 15 });
		let oldValue = 0;
		if (settings) {
			oldValue = settings.points;
			settings.points = amount;
			await settings.save();
		} else {
			const created = new MemberEntity();
			created.userID = user.id;
			created.guildID = message.guild!.id;
			created.points = amount;
			await members.insert(created);
		}

		const variation = amount - oldValue;
		if (variation === 0) return message.sendLocale('COMMAND_SOCIAL_UNCHANGED', [{ user: user.username }]);
		return message.sendMessage(
			variation > 0
				? message.language.get('COMMAND_SOCIAL_ADD', { user: user.username, amount, added: variation })
				: message.language.get('COMMAND_SOCIAL_REMOVE', { user: user.username, amount, removed: -variation })
		);
	}

	public async reset(message: KlasaMessage, [user]: [User]) {
		const { members } = await DbSet.connect();
		await members.delete({ userID: user.id, guildID: message.guild!.id });
		return message.sendLocale('COMMAND_SOCIAL_RESET', [{ user: user.username }]);
	}
}
