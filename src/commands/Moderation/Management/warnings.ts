import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage, KlasaUser, util } from 'klasa';
import { ModerationManagerEntry } from '../../../lib/structures/ModerationManagerEntry';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { UserRichDisplay } from '../../../lib/structures/UserRichDisplay';
import { ModerationTypeKeys } from '../../../lib/util/constants';

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_WARNINGS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_WARNINGS_EXTENDED'),
			permissionLevel: 5,
			requiredPermissions: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
			runIn: ['text'],
			usage: '[user:username]'
		});
	}

	public async run(message: KlasaMessage, [target]: [KlasaUser]) {
		const warnings = (await message.guild.moderation.fetch(target ? target.id : undefined)).filter((log) => log.type === ModerationTypeKeys.Warn);
		if (!warnings.length) throw message.language.get('COMMAND_WARNINGS_EMPTY');

		const display = new UserRichDisplay(new MessageEmbed()
			.setColor(message.member.displayColor)
			.setAuthor(this.client.user.username, this.client.user.displayAvatarURL())
			.setTitle(message.language.get('COMMAND_WARNINGS_AMOUNT', warnings.length)));

		// Fetch usernames
		const users = new Map() as Map<string, string>;
		for (const warning of warnings.values()) {
			const id = typeof warning.moderator === 'string' ? warning.moderator : warning.moderator.id;
			if (!users.has(id)) users.set(id, await this.client.fetchUsername(id));
		}

		// Set up the formatter
		const format = this.displayWarning.bind(this, users);

		for (const page of util.chunk([...warnings.values()], 10))
			display.addPage((template) => template.setDescription(page.map(format)));

		await display.run(await message.sendLocale('SYSTEM_LOADING') as KlasaMessage, message.author.id);
		return message;
	}

	public displayWarning(users: Map<string, string>, warning: ModerationManagerEntry) {
		const id = typeof warning.moderator === 'string' ? warning.moderator : warning.moderator.id;
		return `Case \`${warning.case}\`. Moderator: **${users.get(id)}**.\n${warning.reason || 'None'}`;
	}

}
