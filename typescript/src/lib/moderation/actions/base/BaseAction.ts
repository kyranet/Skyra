import type { ModerationEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { ModerationManagerCreateData } from '#lib/moderation';
import { Moderation } from '#utils/constants';
import { resolveOnErrorCodes } from '#utils/util';
import { err, ok, Result } from '@sapphire/framework';
import type { Awaited } from '@sapphire/pieces';
import { RESTJSONErrorCodes } from 'discord-api-types/v6';
import { Guild, GuildMember, MessageEmbed, User } from 'discord.js';

export type AttachContext<Options, Context> = Options & { context: Context };
export type AttachPreHandledContext<Options, Context> = AttachContext<Options, Context> & { entry: ModerationEntity };
export type AttachResultContext<Options, Context> = AttachContext<Options, Context> & { results: HandleMembersResults };

export type HandleMembersResult = Result<User, string>;
export type HandleMembersResults = HandleMembersResult[];
export type HandleMembersResultAsync = Promise<HandleMembersResults>;

export type HandleMemberResult = Awaited<HandleMembersResult>;
export type HandleMemberResultAsync = Promise<HandleMembersResult>;

export abstract class BaseAction<Options extends BaseAction.RunOptions = BaseAction.RunOptions, Context = unknown> {
	protected readonly type: number;

	public constructor(options: BaseAction.Options) {
		this.type = options.type;
	}

	public async run(options: Options) {
		const context = await this.preHandle(options);
		const contextOptions = { ...options, context };

		const results = await this.handleTargets(contextOptions);
		const resultOptions = { ...contextOptions, results };

		await this.postHandle(resultOptions);
		return results;
	}

	protected ok(value: User): HandleMembersResult {
		return ok(value);
	}

	protected error(error: string): HandleMembersResult {
		return err(error);
	}

	protected preHandle(options: Options): Awaited<Context>;
	protected preHandle(): unknown {
		return null;
	}

	protected async handleTargets(options: AttachContext<Options, Context>): HandleMembersResultAsync {
		const results: HandleMembersResults = [];
		for (const user of options.users) {
			// Pre-handle target:
			const entry = await this.preHandleTarget(user, options);
			const entryOptions = { ...options, entry };

			// Handle target, perform the action:
			const result = await this.handleTarget(user, entryOptions);
			results.push(result);

			// Post-handle target:
			await this.postHandleTarget(user, entryOptions);
		}

		return results;
	}

	protected async preHandleTarget(user: User, options: AttachContext<Options, Context>): Promise<ModerationEntity> {
		const entry = options.guild.moderation.create(this.transformModerationEntryOptions(user, options));
		if (options.sendDirectMessage) await this.postHandleTargetLogSendDirectMessage(entry, options);
		return (await entry.create())!;
	}

	protected abstract handleTarget(user: User, options: AttachPreHandledContext<Options, Context>): HandleMemberResultAsync;

	protected async postHandleTarget(user: User, options: AttachPreHandledContext<Options, Context>): Promise<void> {
		await this.postHandleTargetLog(user, options);
	}

	protected async postHandleTargetLog(user: User, options: AttachPreHandledContext<Options, Context>): Promise<unknown>;
	protected async postHandleTargetLog(_: User, options: AttachPreHandledContext<Options, Context>): Promise<void> {
		await options.entry.create();
	}

	protected async postHandleTargetLogSendDirectMessage(entry: ModerationEntity, options: AttachContext<Options, Context>): Promise<void> {
		try {
			const target = await entry.fetchUser();
			const embed = await this.buildEmbed(entry, options);
			await resolveOnErrorCodes(target.send(embed), RESTJSONErrorCodes.CannotSendMessagesToThisUser);
		} catch (error) {
			options.guild.client.logger.error(error);
		}
	}

	protected postHandle(options: AttachResultContext<Options, Context>): Awaited<unknown>;
	protected postHandle(): unknown {
		return null;
	}

	protected transformModerationEntryOptions(user: User, options: Options): ModerationManagerCreateData {
		return {
			type: this.type,
			userID: user.id,
			moderatorID: options.author.id,
			duration: null,
			imageURL: options.image,
			reason: options.reason
		};
	}

	private async buildEmbed(entry: ModerationEntity, options: AttachContext<Options, Context>) {
		const descriptionKey = entry.reason
			? entry.duration
				? LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithReasonWithDuration
				: LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithReason
			: entry.duration
			? LanguageKeys.Commands.Moderation.ModerationDmDescriptionWithDuration
			: LanguageKeys.Commands.Moderation.ModerationDmDescription;

		const t = await options.guild.fetchT();
		const embed = new MessageEmbed() //
			.setDescription(t(descriptionKey, { guild: options.guild.name, title: entry.title, reason: entry.reason, duration: entry.duration }))
			.setFooter(t(LanguageKeys.Commands.Moderation.ModerationDmFooter));

		if (options.displayModerator) {
			embed.setAuthor(options.author.user.username, options.author.user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }));
		}

		return embed;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BaseAction {
	export interface Options {
		type: Moderation.TypeCodes;
	}

	export interface RunOptions {
		author: GuildMember;
		sendDirectMessage: boolean;
		guild: Guild;
		image: string | null;
		displayModerator: boolean;
		reason: string;
		users: readonly User[];
	}
}
