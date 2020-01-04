import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { api } from '@utils/Models/Api';
import { resolveEmoji } from '@utils/util';
import { Role } from 'discord.js';
import { CommandStore, KlasaMessage, util } from 'klasa';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: language => language.tget('COMMAND_MANAGEROLEREACTION_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_MANAGEROLEREACTION_EXTENDED'),
			permissionLevel: PermissionLevels.Administrator,
			requiredPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
			runIn: ['text'],
			subcommands: true,
			usage: '<add|remove|reset|show:default> (role:rolename) (emoji:emoji)',
			usageDelim: ' '
		});

		this.createCustomResolver('emoji', async (arg, _, msg, [action]) => {
			if (action === 'show' || action === 'reset') return undefined;
			if (!arg) throw msg.language.tget('COMMAND_MANAGEROLEREACTION_REQUIRED_REACTION');

			const emoji = resolveEmoji(arg);
			if (emoji === null) throw msg.language.tget('COMMAND_TRIGGERS_INVALIDREACTION');

			try {
				await msg.react(emoji);
				return emoji;
			} catch {
				throw msg.language.tget('COMMAND_TRIGGERS_INVALIDREACTION');
			}
		}).createCustomResolver('rolename', (arg, possible, msg, [action]) => {
			if (action !== 'add') return undefined;
			if (!arg) throw msg.language.tget('COMMAND_MANAGEROLEREACTION_REQUIRED_ROLE');
			return this.client.arguments.get('rolename')!.run(arg, possible, msg);
		});
	}

	public async show(message: KlasaMessage) {
		const list = new Set(message.guild!.settings.get(GuildSettings.Roles.Reactions));
		const oldLength = list.size;
		if (!list.size) throw message.language.tget('COMMAND_MANAGEROLEREACTION_LIST_EMPTY');
		const lines: string[] = [];
		for (const entry of list) {
			const role = message.guild!.roles.get(entry.role);
			if (role) lines.push(`${role.name.padEnd(25, ' ')} :: ${entry.emoji}`);
			else list.delete(entry);
		}
		if (oldLength !== list.size) {
			await message.guild!.settings.update(GuildSettings.Roles.Reactions, [...list], { arrayAction: 'overwrite' });
		}
		if (!lines.length) throw message.language.tget('COMMAND_MANAGEROLEREACTION_LIST_EMPTY');
		return message.sendMessage(util.codeBlock('asciicode', lines.join('\n')));
	}

	public async add(message: KlasaMessage, [role, reaction]: [Role, string]) {
		if (this._checkRoleReaction(message, reaction, role.id)) throw message.language.tget('COMMAND_MANAGEROLEREACTION_EXISTS');
		await message.guild!.settings.update(GuildSettings.Roles.Reactions, { emoji: reaction, role: role.id }, { arrayAction: 'add' });
		if (message.guild!.settings.get(GuildSettings.Roles.MessageReaction)) {
			await this._reactMessage(
				message.guild!.settings.get(GuildSettings.Channels.Roles),
				message.guild!.settings.get(GuildSettings.Roles.MessageReaction),
				reaction
			);
		}
		return message.sendLocale('COMMAND_MANAGEROLEREACTION_ADD');
	}

	public async remove(message: KlasaMessage, [, reaction]: [Role, string]) {
		const list = message.guild!.settings.get(GuildSettings.Roles.Reactions);
		if (!list.length) throw message.language.tget('COMMAND_MANAGEROLEREACTION_LIST_EMPTY');
		const entry = list.find(en => en.emoji === reaction);
		if (!entry) throw message.language.tget('COMMAND_MANAGEROLEREACTION_REMOVE_NOTEXISTS');
		await message.guild!.settings.update(GuildSettings.Roles.Reactions, entry, { arrayAction: 'remove' });
		return message.sendLocale('COMMAND_MANAGEROLEREACTION_REMOVE');
	}

	public async reset(message: KlasaMessage) {
		const list = message.guild!.settings.get(GuildSettings.Roles.Reactions);
		if (!list.length) throw message.language.tget('COMMAND_MANAGEROLEREACTION_LIST_EMPTY');
		await message.guild!.settings.reset(GuildSettings.Roles.Reactions);
		return message.sendLocale('COMMAND_MANAGEROLEREACTION_RESET');
	}

	public _reactMessage(channelID: string, messageID: string, reaction: string) {
		return api(this.client)
			.channels(channelID)
			.messages(messageID)
			.reactions(this.client.emojis.resolveIdentifier(reaction)!, '@me')
			.put();
	}

	public _checkRoleReaction(message: KlasaMessage, reaction: string, roleID: string) {
		const list = message.guild!.settings.get(GuildSettings.Roles.Reactions);
		if (list.length) for (const entry of list) if (entry.emoji === reaction || entry.role === roleID) return true;
		return false;
	}

}
