import type { LanguageHelpDisplayOptions } from '#lib/i18n/LanguageHelp';
import { SkyraArgs } from '#lib/structures/commands/SkyraArgs';
import {
	SkyraCommandConstructorDefaults,
	implementSkyraCommandError,
	implementSkyraCommandPaginatedOptions,
	implementSkyraCommandParseConstructorPreConditionsPermissionLevel,
	implementSkyraCommandPreParse,
	type ExtendOptions
} from '#lib/structures/commands/base/BaseSkyraCommandUtilities';
import { PermissionLevels, type CustomGet } from '#lib/types';
import { Command, UserError, type Awaitable, type MessageCommand, type PieceContext } from '@sapphire/framework';
import { type Message } from 'discord.js';

/**
 * The base class for all Skyra commands.
 * @seealso {@link SkyraSubcommand} for subcommand support.
 */
export abstract class SkyraCommand extends Command<SkyraCommand.Args, SkyraCommand.Options> {
	public readonly guarded: boolean;
	public readonly hidden: boolean;
	public readonly permissionLevel: PermissionLevels;
	public declare readonly detailedDescription: CustomGet<string, LanguageHelpDisplayOptions>;
	public declare readonly description: CustomGet<string, string>;

	public constructor(context: PieceContext, options: SkyraCommand.Options) {
		super(context, { ...SkyraCommandConstructorDefaults, ...options });
		this.guarded = options.guarded ?? SkyraCommandConstructorDefaults.guarded;
		this.hidden = options.hidden ?? SkyraCommandConstructorDefaults.hidden;
		this.permissionLevel = options.permissionLevel ?? SkyraCommandConstructorDefaults.permissionLevel;
	}

	public abstract override messageRun(message: Message, args: SkyraCommand.Args, context: MessageCommand.RunContext): Awaitable<unknown>;

	/**
	 * The pre-parse method. This method can be overridden by plugins to define their own argument parser.
	 * @param message The message that triggered the command.
	 * @param parameters The raw parameters as a single string.
	 * @param context The command-context used in this execution.
	 */
	public override messagePreParse(message: Message, parameters: string, context: MessageCommand.RunContext): Promise<SkyraCommand.Args> {
		return implementSkyraCommandPreParse(this as MessageCommand, message, parameters, context);
	}

	protected error(identifier: string | UserError, context?: unknown): never {
		implementSkyraCommandError(identifier, context);
	}

	protected override parseConstructorPreConditions(options: SkyraCommand.Options): void {
		super.parseConstructorPreConditions(options);
		implementSkyraCommandParseConstructorPreConditionsPermissionLevel(this, options.permissionLevel);
	}

	public static readonly PaginatedOptions = implementSkyraCommandPaginatedOptions<SkyraCommand.Options>;
}

export namespace SkyraCommand {
	export type Options = ExtendOptions<Command.Options>;
	export type Args = SkyraArgs;
	export type Context = Command.Context;
	export type RunContext = MessageCommand.RunContext;
}
