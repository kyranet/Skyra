import { GuildSettings, readSettings, TriggerAlias, TriggerIncludes, writeSettings } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand, SkyraPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import { displayEmoji } from '#utils/util';
import { ApplyOptions, RequiresClientPermissions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { chunk } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import { MessageEmbed } from 'discord.js';

const enum Type {
	Alias,
	Reaction
}

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['trigger'],
	description: LanguageKeys.Commands.Management.TriggersDescription,
	extendedHelp: LanguageKeys.Commands.Management.TriggersExtended,
	permissionLevel: PermissionLevels.Administrator,
	runIn: ['GUILD_ANY'],
	subCommands: ['add', 'remove', { input: 'show', default: true }]
})
export class UserCommand extends SkyraCommand {
	public async add(message: GuildMessage, args: SkyraCommand.Args) {
		const type = await args.pick(UserCommand.type);
		const input = (await args.pick('string')).toLowerCase();
		const output = type === Type.Alias ? (await args.pick('command')).name : await args.pick('emoji');
		await writeSettings(message.guild, (settings) => {
			const key = this.getListName(type);

			const list = settings[key];
			const alreadySet = list.some((entry) => entry.input === input);
			if (alreadySet) this.error(LanguageKeys.Commands.Management.TriggersAddTaken);

			list.push(this.format(type, input, output) as any);
		});

		const content = args.t(LanguageKeys.Commands.Management.TriggersAdd);
		return send(message, content);
	}

	public async remove(message: GuildMessage, args: SkyraCommand.Args) {
		const type = await args.pick(UserCommand.type);
		const input = (await args.pick('string')).toLowerCase();
		await writeSettings(message.guild, (settings) => {
			const key = this.getListName(type);

			const list = settings[key];
			const index = list.findIndex((entry) => entry.input === input);
			if (index === -1) this.error(LanguageKeys.Commands.Management.TriggersRemoveNotTaken);

			list.splice(index, 1);
		});

		const content = args.t(LanguageKeys.Commands.Management.TriggersRemove);
		return send(message, content);
	}

	@RequiresClientPermissions(['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
	public async show(message: GuildMessage) {
		const [aliases, includes] = await readSettings(message.guild, [GuildSettings.Trigger.Alias, GuildSettings.Trigger.Includes]);

		const output: string[] = [];
		for (const alias of aliases) {
			output.push(`Alias \`${alias.input}\` -> \`${alias.output}\``);
		}
		for (const react of includes) {
			output.push(`Reaction :: \`${react.input}\` -> ${displayEmoji(react.output)}`);
		}
		if (!output.length) this.error(LanguageKeys.Commands.Management.TriggersListEmpty);

		const display = new SkyraPaginatedMessage({
			template: new MessageEmbed()
				.setAuthor(message.author.username, message.author.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
				.setColor(await this.container.db.fetchColor(message))
		});

		for (const page of chunk(output, 10)) {
			display.addPageEmbed((embed) => embed.setDescription(page.join('\n')));
		}

		return display.run(message);
	}

	private format(type: Type, input: string, output: string): TriggerIncludes | TriggerAlias {
		switch (type) {
			case Type.Alias:
				return { input, output };
			case Type.Reaction:
				return { action: 'react', input, output };
			default:
				throw new TypeError(`Unknown Type: ${type}`);
		}
	}

	private getListName(type: Type) {
		switch (type) {
			case Type.Alias:
				return GuildSettings.Trigger.Alias;
			case Type.Reaction:
				return GuildSettings.Trigger.Includes;
			default:
				throw new TypeError(`Unknown Type: ${type}`);
		}
	}

	private static type = Args.make<Type>((parameter, { argument }) => {
		const lowerCasedParameter = parameter.toLowerCase();
		if (lowerCasedParameter === 'alias') return Args.ok(Type.Alias);
		if (lowerCasedParameter === 'reaction') return Args.ok(Type.Reaction);
		return Args.error({ argument, parameter });
	});
}
