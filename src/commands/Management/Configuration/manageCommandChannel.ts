import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { TextChannel } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('commandManageCommandChannelDescription'),
			extendedHelp: (language) => language.get('commandManageCommandChannelExtended'),
			permissionLevel: PermissionLevels.Administrator,
			runIn: ['text'],
			subcommands: true,
			usage: '<show|add|remove|reset> (channel:channel) (command:command)',
			usageDelim: ' '
		});

		this.createCustomResolver('channel', async (arg, possible, msg) => {
			if (!arg) return msg.channel;
			const channel = await this.client.arguments.get('channelname')!.run(arg, possible, msg);
			if (channel.type === 'text') return channel;
			throw msg.language.get('commandManageCommandChannelTextChannel');
		}).createCustomResolver('command', async (arg, possible, msg, [type]) => {
			if (type === 'show' || type === 'reset') return undefined;
			if (arg) {
				const command = await this.client.arguments.get('command')!.run(arg, possible, msg);
				if (!command.disabled && command.permissionLevel < 9) return command;
			}
			throw msg.language.get('commandManageCommandChannelRequiredCommand');
		});
	}

	public async show(message: KlasaMessage, [channel]: [TextChannel]) {
		const disabledCommandsChannels = message.guild!.settings.get(GuildSettings.DisabledCommandChannels);
		const entry = disabledCommandsChannels.find((e) => e.channel === channel.id);
		if (entry && entry.commands.length) {
			return message.sendLocale('commandManageCommandChannelShow', [
				{ channel: channel.toString(), commands: `\`${entry.commands.join('` | `')}\`` }
			]);
		}
		throw message.language.get('commandManageCommandChannelShowEmpty');
	}

	public async add(message: KlasaMessage, [channel, command]: [TextChannel, SkyraCommand]) {
		const disabledCommandsChannels = message.guild!.settings.get(GuildSettings.DisabledCommandChannels);
		const index = disabledCommandsChannels.findIndex((e) => e.channel === channel.id);

		if (index === -1) {
			await message.guild!.settings.update(
				GuildSettings.DisabledCommandChannels,
				{ channel: channel.id, commands: [command.name] },
				{
					arrayAction: 'add',
					extraContext: { author: message.author.id }
				}
			);
		} else {
			const entry = disabledCommandsChannels[index];
			if (entry.commands.includes(command.name)) throw message.language.get('commandManageCommandChannelAddAlreadyset');

			await message.guild!.settings.update(
				GuildSettings.DisabledCommandChannels,
				{ channel: entry.channel, commands: entry.commands.concat(command.name) },
				{
					arrayIndex: index,
					extraContext: { author: message.author.id }
				}
			);
		}
		return message.sendLocale('commandManageCommandChannelAdd', [{ channel: channel.toString(), command: command.name }]);
	}

	public async remove(message: KlasaMessage, [channel, command]: [TextChannel, SkyraCommand]) {
		const disabledCommandsChannels = message.guild!.settings.get(GuildSettings.DisabledCommandChannels);
		const index = disabledCommandsChannels.findIndex((e) => e.channel === channel.id);

		if (index !== -1) {
			const entry = disabledCommandsChannels[index];
			const commandIndex = entry.commands.indexOf(command.name);
			if (commandIndex !== -1) {
				if (entry.commands.length > 1) {
					const clone = entry.commands.slice();
					clone.splice(commandIndex, 1);
					await message.guild!.settings.update(
						GuildSettings.DisabledCommandChannels,
						{ channel: entry.channel, commands: clone },
						{
							extraContext: { author: message.author.id }
						}
					);
				} else {
					await message.guild!.settings.update(GuildSettings.DisabledCommandChannels, entry, {
						arrayAction: 'remove',
						extraContext: { author: message.author.id }
					});
				}

				return message.sendLocale('commandManageCommandChannelRemove', [{ channel: channel.toString(), command: command.name }]);
			}
		}
		throw message.language.get('commandManageCommandChannelRemoveNotset', { channel: channel.toString() });
	}

	public async reset(message: KlasaMessage, [channel]: [TextChannel]) {
		const disabledCommandsChannels = message.guild!.settings.get(GuildSettings.DisabledCommandChannels);
		const entry = disabledCommandsChannels.find((e) => e.channel === channel.id);

		if (entry) {
			await message.guild!.settings.update(GuildSettings.DisabledCommandChannels, entry, {
				arrayAction: 'remove',
				extraContext: { author: message.author.id }
			});
			return message.sendLocale('commandManageCommandChannelReset', [{ channel: channel.toString() }]);
		}
		throw message.language.get('commandManageCommandChannelResetEmpty');
	}
}
