import { CommandStore, KlasaClient, KlasaMessage, util } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { GuildSettings } from '../../lib/types/settings/GuildSettings';

const REG_TYPE = /alias|reaction/i;
const REG_REAC = /^<(:[^:]+:\d{17,19})>$/;

export default class extends SkyraCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			cooldown: 5,
			description: (language) => language.get('COMMAND_TRIGGERS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_TRIGGERS_EXTENDED'),
			permissionLevel: 6,
			quotedStringSupport: true,
			requiredPermissions: ['ADD_REACTIONS'],
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|show:default> (type:type) (input:input) (output:output)',
			usageDelim: ' '
		});

		this.createCustomResolver('type', (arg, _, msg, [action]) => {
			if (action === 'show') return undefined;
			if (REG_TYPE.test(arg)) return arg.toLowerCase();
			throw msg.language.get('COMMAND_TRIGGERS_NOTYPE');
		}).createCustomResolver('input', (arg, _, msg, [action]) => {
			if (action === 'show') return undefined;
			if (!arg) throw msg.language.get('COMMAND_TRIGGERS_NOOUTPUT');
			return arg.toLowerCase();
		}).createCustomResolver('output', async(arg, _, msg, [action, type]) => {
			if (action === 'show' || action === 'remove') return undefined;
			if (!arg) throw msg.language.get('COMMAND_TRIGGERS_NOOUTPUT');
			if (type === 'reaction') {
				try {
					if (REG_REAC.test(arg)) [, arg] = REG_REAC.exec(arg);
					await msg.react(arg);
					return arg;
				} catch (_) {
					throw msg.language.get('COMMAND_TRIGGERS_INVALIDREACTION');
				}
			} else if (type === 'alias') {
				const command = this.client.commands.get(arg);
				if (command && command.permissionLevel < 10) return arg;
				throw msg.language.get('COMMAND_TRIGGERS_INVALIDALIAS');
			} else {
				return null;
			}
		});
	}

	public async remove(message: KlasaMessage, [type, input]: [string, string]) {
		const list = this._getList(message, type);
		const index = list.findIndex((entry) => entry.input === input);
		if (index === -1) throw message.language.get('COMMAND_TRIGGERS_REMOVE_NOTTAKEN');

		// Create a shallow clone and remove the item
		const clone = [...list];
		clone.splice(index, 1);

		const { errors } = await message.guild.settings.update(this._getListName(type), clone, { arrayAction: 'overwrite' });
		if (errors.length) throw errors[0];

		return message.sendLocale('COMMAND_TRIGGERS_REMOVE');
	}

	public async add(message: KlasaMessage, [type, input, output]: [string, string, string]) {
		const list = this._getList(message, type);
		if (list.some((entry) => entry.input === input)) throw message.language.get('COMMAND_TRIGGERS_ADD_TAKEN');

		const { errors } = await message.guild.settings.update(this._getListName(type), [...list, this._format(type, input, output)], { arrayAction: 'overwrite' });
		if (errors.length) throw errors[0];

		return message.sendLocale('COMMAND_TRIGGERS_ADD');
	}

	public show(message: KlasaMessage) {
		const aliases = message.guild.settings.get(GuildSettings.Trigger.Alias) as GuildSettings.Trigger.Alias;
		const includes = message.guild.settings.get(GuildSettings.Trigger.Includes) as GuildSettings.Trigger.Includes;
		const output = [];
		for (const alias of aliases)
			output.push(`Alias    :: ${alias.input} -> ${alias.output}`);
		for (const react of includes)
			output.push(`Reaction :: ${react.input} -> ${react.output}`);
		if (!output.length) throw message.language.get('COMMAND_TRIGGERS_LIST_EMPTY');
		return message.sendMessage(util.codeBlock('asciidoc', output.join('\n')));
	}

	private _format(type: string, input: string, output: string) {
		switch (type) {
			case 'alias': return { input, output };
			case 'reaction': return { action: 'react', input, output };
			default: throw new TypeError('UNKNOWN TYPE');
		}
	}

	private _getListName(type: string) {
		switch (type) {
			case 'alias': return 'trigger.alias';
			case 'reaction':
			default: return 'trigger.includes';
		}
	}

	private _getList(message: KlasaMessage, type: string) {
		switch (type) {
			case 'alias': return message.guild.settings.get(GuildSettings.Trigger.Alias) as GuildSettings.Trigger.Alias;
			case 'reaction':
			default: return message.guild.settings.get(GuildSettings.Trigger.Includes) as GuildSettings.Trigger.Includes;
		}
	}

}
