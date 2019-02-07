import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../lib/types/settings/GuildSettings';
import { MemberSettings } from '../../lib/types/settings/MemberSettings';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 15,
			description: (language) => language.get('COMMAND_MYLEVEL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_MYLEVEL_EXTENDED'),
			runIn: ['text'],
			usage: '[user:username]'
		});

		this.spam = true;
	}

	public async run(message: KlasaMessage, [user = message.author]: [KlasaUser]) {
		const member = await message.guild.members.fetch(user.id).catch(() => {
			throw message.language.get('USER_NOT_IN_GUILD');
		});

		await member.settings.sync();
		const memberPoints = member.settings.get(MemberSettings.Points) as MemberSettings.Points;
		const nextRole = this.getLatestRole(memberPoints, message.guild.settings.get(GuildSettings.Roles.Auto) as GuildSettings.Roles.Auto);
		const title = nextRole
			? `\n${message.language.get('COMMAND_MYLEVEL_NEXT', nextRole.points - memberPoints, nextRole.points)}`
			: '';

		return message.sendLocale('COMMAND_MYLEVEL', [memberPoints, title, user.id === message.author.id ? null : user.username]);
	}

	public getLatestRole(points: number, autoroles: GuildSettings.Roles.Auto) {
		for (const autorole of autoroles)
			if (autorole.points > points) return autorole;

		return null;
	}

}
