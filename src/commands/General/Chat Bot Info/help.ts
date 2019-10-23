import { MessageEmbed, Permissions, TextChannel, Collection } from 'discord.js';
import { CommandStore, KlasaMessage, util, Command } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';
import { UserRichDisplay } from '../../../lib/structures/UserRichDisplay';
import { getColor, noop } from '../../../lib/util/util';
import { GuildSettings } from '../../../lib/types/settings/GuildSettings';

const PERMISSIONS_RICHDISPLAY = new Permissions([Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.ADD_REACTIONS]);

type Category = [string, Command[]];

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['commands', 'cmd', 'cmds'],
			description: language => language.tget('COMMAND_HELP_DESCRIPTION'),
			guarded: true,
			usage: '(Command:command|category:category|page:integer)',
			flagSupport: true
		});

		this.createCustomResolver('command', (arg, possible, message) => {
			if (!arg) return undefined;
			return this.client.arguments.get('command').run(arg, possible, message);
		});
		this.createCustomResolver('category', async (arg, _, msg) => {
			if (!arg) return undefined;
			arg = arg.toLowerCase();
			const commandsByCategory = await this._fetchCommands(msg);
			for (const [category, commands] of commandsByCategory) {
				if (category.toLowerCase() === arg) return [category, commands];
			}
			return undefined;
		});
	}

	public async run(message: KlasaMessage, [commandOrCategoryOrPage]: [Command | Category | number | undefined]) {
		if (message.flagArgs.categories || message.flagArgs.cat) {
			const commandsByCategory = await this._fetchCommands(message);
			const { language } = message;
			let i = 0;
			const commandCategories: string[] = [];
			for (const [category, commands] of commandsByCategory) {
				const line = String(++i).padStart(2, '0');
				commandCategories.push(`\`${line}.\` **${category}** → ${language.tget('COMMAND_HELP_COMMAND_COUNT', commands.length)}`);
			}
			return message.sendMessage(commandCategories);
		}

		// Handle case for a single command
		const command = commandOrCategoryOrPage && !util.isNumber(commandOrCategoryOrPage) ? commandOrCategoryOrPage : null;
		if (command) {
			return message.sendMessage([
				message.language.tget('COMMAND_HELP_TITLE', command.name, util.isFunction(command.description) ? command.description(message.language) : command.description),
				message.language.tget('COMMAND_HELP_USAGE', command.usage.fullUsage(message)),
				message.language.tget('COMMAND_HELP_EXTENDED', util.isFunction(command.extendedHelp) ? command.extendedHelp(message.language) : command.extendedHelp)
			].join('\n'));
		}

		if (!message.flagArgs.all && message.guild && (message.channel as TextChannel).permissionsFor(this.client.user!)!.has(PERMISSIONS_RICHDISPLAY)) {
			const response = await message.sendMessage(
				message.language.tget('COMMAND_HELP_ALL_FLAG', message.guildSettings.get(GuildSettings.Prefix)),
				new MessageEmbed({ description: message.language.tget('SYSTEM_LOADING'), color: getColor(message) || 0xFFAB2D })
			);
			const display = await this.buildDisplay(message);

			// Extract start page and sanitize it
			let startPage = commandOrCategoryOrPage && util.isNumber(commandOrCategoryOrPage) ? --commandOrCategoryOrPage : null;
			if (startPage !== null) {
				if (startPage < 0 || startPage >= display.pages.length) startPage = 0;
			}
			await display.start(response, message.author.id, startPage === null ? undefined : { startPage });
			return response;
		}

		try {
			const response = await message.author.send(await this.buildHelp(message), { split: { 'char': '\n' } });
			return message.channel.type === 'dm' ? response : message.sendLocale('COMMAND_HELP_DM');
		} catch {
			return message.channel.type === 'dm' ? null : message.sendLocale('COMMAND_HELP_NODM');
		}
	}

	private async buildHelp(message: KlasaMessage) {
		const commands = await this._fetchCommands(message);
		const prefix = message.guildSettings.get(GuildSettings.Prefix);

		const helpMessage: string[] = [];
		for (const [category, list] of commands) {
			helpMessage.push(`**${category} Commands**:\n`, list.map(this.formatCommand.bind(this, message, prefix, false)).join('\n'), '');
		}

		return helpMessage.join('\n');
	}

	private async buildDisplay(message: KlasaMessage) {
		const commands = await this._fetchCommands(message);
		const prefix = message.guildSettings.get(GuildSettings.Prefix);

		const display = new UserRichDisplay();
		const color = getColor(message) || 0xFFAB2D;
		for (const [category, list] of commands) {
			display.addPage(new MessageEmbed()
				.setTitle(`${category} Commands`)
				.setColor(color)
				.setDescription(list.map(this.formatCommand.bind(this, message, prefix, true)).join('\n')));
		}

		return display;
	}

	private formatCommand(message: KlasaMessage, prefix: string, richDisplay: boolean, command: Command) {
		const description = util.isFunction(command.description) ? command.description(message.language) : command.description;
		return richDisplay ? `• ${prefix}${command.name} → ${description}` : `• **${prefix}${command.name}** → ${description}`;
	}

	private async _fetchCommands(message: KlasaMessage) {
		const run = this.client.inhibitors.run.bind(this.client.inhibitors, message);
		const commands = new Collection<string, Command[]>();
		await Promise.all(this.client.commands.map(command => run(command, true)
			.then(() => {
				const category = commands.get(command.category);
				if (category) category.push(command);
				else commands.set(command.category, [command]);
				return null;
			}).catch(noop)));

		return commands;
	}

}
