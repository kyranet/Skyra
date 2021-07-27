import { GuildEntity, GuildSettings } from '#lib/database';
import { api } from '#lib/discord/Api';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { KeyOfType } from '#lib/types';
import { Store, UserError } from '@sapphire/framework';
import { isNullish, Nullish } from '@sapphire/utilities';
import { RESTJSONErrorCodes } from 'discord-api-types/common';
import { DiscordAPIError, Role, User } from 'discord.js';
import type { AttachPreHandledContext, HandleMemberResultAsync } from './BaseAction';
import { BaseReversibleAction } from './BaseReversibleAction';

export abstract class BaseRoleAction extends BaseReversibleAction<BaseRoleAction.RunOptions, BaseRoleAction.Context> {
	protected readonly roleAction: RoleAction;
	protected readonly roleActionSticky: boolean;
	protected readonly roleExclusive: boolean;

	public constructor(options: BaseRoleAction.Options) {
		super(options);
		this.roleAction = options.roleAction;
		this.roleActionSticky = options.roleActionSticky ?? false;
		this.roleExclusive = options.roleExclusive ?? false;
	}

	protected throwMissingRole(): never {
		// TODO(kyranet): Use better identifier:
		throw new UserError({ identifier: LanguageKeys.Commands.Moderation.MuteNotConfigured });
	}

	protected async preHandle(options: BaseRoleAction.RunOptions): Promise<BaseRoleAction.Context> {
		const role = options.role === undefined ? undefined : options.guild.roles.cache.get(options.role);
		if (role === undefined) this.throwMissingRole();

		const excluded = await this.preHandleExcluded(options);
		return { role, excluded };
	}

	protected async preHandleExcluded(options: BaseRoleAction.RunOptions): Promise<string[]> {
		const excludedRoleIds = await options.guild.readSettings(BaseRoleAction.excludedConfigurationKeys);

		const roles = options.guild.roles.cache;
		return excludedRoleIds.filter((protectedRoleId) => !isNullish(protectedRoleId) && roles.has(protectedRoleId)) as string[];
	}

	protected async handleTarget(user: User, options: BaseRoleAction.PreHandledRunOptions): HandleMemberResultAsync {
		try {
			switch (this.roleAction) {
				case RoleAction.Add:
					return this.ok(await this.handleTargetAdd(user, options));
				case RoleAction.Remove:
					return this.ok(await this.handleTargetRemove(user, options));
			}
		} catch (error) {
			if (error instanceof DiscordAPIError) {
				// TODO(kyranet): Use i18n here
				if (error.code === RESTJSONErrorCodes.UnknownMember) return this.error('unknownMember');
				// TODO(kyranet): Use i18n here
				if (error.code === RESTJSONErrorCodes.UnknownRole) return this.error('unknownRole');
				// TODO(kyranet): Use i18n here
				if (error.code === RESTJSONErrorCodes.MissingPermissions) return this.error('missingPermissions');
			}

			Store.injectedContext.logger.fatal(error);
			// TODO(kyranet): Use i18n here
			return this.error('unknownError');
		}
	}

	protected async handleTargetAdd(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<User> {
		if (options.exclusive ?? this.roleExclusive) await this.handleTargetAddExclusive(user, options);
		else await this.handleTargetAddSingle(user, options);
		return user;
	}

	protected async handleTargetAddSingle(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<void> {
		// TODO(kyranet): Add reason
		await api().guilds(options.guild.id).members(user.id).roles(options.context.role.id).put({ reason: '' });
	}

	protected async handleTargetAddExclusive(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<void> {
		const member = await options.guild.members.fetch(user.id);
		const roles = member.roles.cache;

		// If the member has only the @everyone role, take short path:
		if (roles.size === 1) return this.handleTargetAddSingle(user, options);

		const keys = new Set(roles.keys());

		// Remove @everyone from list:
		keys.delete(options.guild.id);

		for (const key of keys) {
			if (options.context.excluded.includes(key)) continue;
			keys.delete(key);
		}

		// If the resulting keys is the same as the source minus 1 (@everyone), take short path:
		if (keys.size === roles.size - 1) return this.handleTargetAddSingle(user, options);

		// Add the desired role:
		keys.add(options.context.role.id);

		// TODO(kyranet): Add reason
		await member.roles.set([...keys], '');
	}

	protected async handleTargetRemove(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<User> {
		await this.handleTargetRemoveSingle(user, options);
		return user;
	}

	protected async handleTargetRemoveSingle(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<void> {
		// TODO(kyranet): Add reason
		await api().guilds(options.guild.id).members(user.id).roles(options.context.role.id).delete({ reason: '' });
	}

	protected async postHandleTarget(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<void> {
		await super.postHandleTarget(user, options);
		if (options.sticky ?? this.roleActionSticky) await this.postHandleTargetSticky(user, options);
	}

	protected async postHandleTargetSticky(user: User, options: BaseRoleAction.PreHandledRunOptions): Promise<void> {
		switch (this.roleAction) {
			case RoleAction.Add:
				await options.guild.stickyRoles.add(user.id, options.context.role.id);
				break;
			case RoleAction.Remove:
				await options.guild.stickyRoles.remove(user.id, options.context.role.id);
				break;
		}
	}

	protected postHandleTargetTaskExtraCallback(user: User, options: BaseRoleAction.PreHandledRunOptions): BaseReversibleAction.ExtraCallback;
	protected postHandleTargetTaskExtraCallback(_: User, options: BaseRoleAction.PreHandledRunOptions): BaseReversibleAction.ExtraCallback {
		return (entry) => entry.extraData !== null && Reflect.get(entry.extraData, 'role') === options.context.role.id;
	}

	protected static excludedConfigurationKeys: BaseRoleAction.RoleKey[] = [
		GuildSettings.Roles.Muted,
		GuildSettings.Roles.RestrictedAttachment,
		GuildSettings.Roles.RestrictedEmbed,
		GuildSettings.Roles.RestrictedEmoji,
		GuildSettings.Roles.RestrictedReaction,
		GuildSettings.Roles.RestrictedVoice
	];
}

export const enum RoleAction {
	Add,
	Remove
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BaseRoleAction {
	export type RoleKey = KeyOfType<GuildEntity, string | Nullish>;

	export interface Options extends BaseReversibleAction.Options {
		roleAction: RoleAction;
		roleActionSticky?: boolean;
		roleExclusive?: boolean;
	}

	export interface Context {
		role: Role;
		excluded: string[];
	}

	export interface RunOptions extends BaseReversibleAction.RunOptions {
		role?: string;
		sticky?: boolean;
		exclusive?: boolean;
	}

	export type PreHandledRunOptions = AttachPreHandledContext<RunOptions, Context>;
}
