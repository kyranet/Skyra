import type { LanguageHelpDisplayOptions } from '#lib/i18n/LanguageHelp';
import type { CustomGet } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import { OWNERS } from '#root/config';
import { seconds } from '#utils/common';
import { CommandContext, PieceContext, PreconditionContainerArray, UserError } from '@sapphire/framework';
import { fetchT } from '@sapphire/plugin-i18next';
import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import type { Message } from 'discord.js';
import * as Lexure from 'lexure';
import { sep } from 'path';
import { SkyraArgs } from './parsers/SkyraArgs';

export abstract class SkyraCommand extends SubCommandPluginCommand<SkyraCommand.Args, SkyraCommand> {
	public readonly guarded: boolean;
	public readonly hidden: boolean;
	public readonly permissionLevel: PermissionLevels;
	public readonly description: CustomGet<string, string>;
	public readonly extendedHelp: CustomGet<string, LanguageHelpDisplayOptions>;

	/**
	 * The full category for the command
	 * @since 0.0.1
	 * @type {string[]}
	 */
	public readonly fullCategory: readonly string[];

	public constructor(context: PieceContext, options: SkyraCommand.Options) {
		super(context, { cooldownDelay: seconds(10), cooldownLimit: 2, cooldownFilteredUsers: OWNERS, generateDashLessAliases: true, ...options });

		this.guarded = options.guarded ?? false;
		this.hidden = options.hidden ?? false;
		this.permissionLevel = options.permissionLevel ?? PermissionLevels.Everyone;
		this.description = options.description;
		this.extendedHelp = options.extendedHelp;

		// Hack that works for Skyra as the commands are always in **/commands/**/*
		const paths = context.path.split(sep);
		this.fullCategory = paths.slice(paths.indexOf('commands') + 1, -1);
	}

	/**
	 * The main category for the command
	 */
	public get category(): string {
		return this.fullCategory.length > 0 ? this.fullCategory[0] : 'General';
	}

	/**
	 * The sub category for the command
	 */
	public get subCategory(): string {
		return this.fullCategory.length > 1 ? this.fullCategory[1] : 'General';
	}

	/**
	 * The pre-parse method. This method can be overridden by plugins to define their own argument parser.
	 * @param message The message that triggered the command.
	 * @param parameters The raw parameters as a single string.
	 * @param context The command-context used in this execution.
	 */
	public async preParse(message: Message, parameters: string, context: CommandContext): Promise<SkyraCommand.Args> {
		const parser = new Lexure.Parser(this.lexer.setInput(parameters).lex()).setUnorderedStrategy(this.strategy);
		const args = new Lexure.Args(parser.parse());
		return new SkyraArgs(message, this, args, context, await fetchT(message));
	}

	protected error(identifier: string | UserError, context?: unknown): never {
		throw typeof identifier === 'string' ? new UserError({ identifier, context }) : identifier;
	}

	protected parseConstructorPreConditions(options: SkyraCommand.Options): void {
		super.parseConstructorPreConditions(options);
		this.parseConstructorPreConditionsSpam(options);
		this.parseConstructorPreConditionsPermissionLevel(options);
	}

	protected parseConstructorPreConditionsSpam(options: SkyraCommand.Options): void {
		if (options.spam) this.preconditions.append('Spam');
	}

	protected parseConstructorPreConditionsPermissionLevel(options: SkyraCommand.Options): void {
		if (options.permissionLevel === PermissionLevels.BotOwner) {
			this.preconditions.append('BotOwner');
			return;
		}

		const container = new PreconditionContainerArray(['BotOwner'], this.preconditions);
		switch (options.permissionLevel ?? PermissionLevels.Everyone) {
			case PermissionLevels.Everyone:
				container.append('Everyone');
				break;
			case PermissionLevels.Moderator:
				container.append('Moderator');
				break;
			case PermissionLevels.Administrator:
				container.append('Administrator');
				break;
			case PermissionLevels.ServerOwner:
				container.append('ServerOwner');
				break;
			default:
				throw new Error(
					`SkyraCommand[${this.name}]: "permissionLevel" was specified as an invalid permission level (${options.permissionLevel}).`
				);
		}

		this.preconditions.append(container);
	}
}

export namespace SkyraCommand {
	/**
	 * The SkyraCommand Options
	 */
	export type Options = SubCommandPluginCommand.Options & {
		description: CustomGet<string, string>;
		extendedHelp: CustomGet<string, LanguageHelpDisplayOptions>;
		guarded?: boolean;
		hidden?: boolean;
		permissionLevel?: number;
		spam?: boolean;
	};

	export type Args = SkyraArgs;
	export type Context = CommandContext;
}
