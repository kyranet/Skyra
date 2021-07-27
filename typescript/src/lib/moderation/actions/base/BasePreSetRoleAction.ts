import { isNullish } from '@sapphire/utilities';
import { PermissionOverwriteOption, RoleData } from 'discord.js';
import { AttachPreHandledContext } from './BaseAction';
import { BaseRoleAction } from './BaseRoleAction';

export abstract class BasePreSetRoleAction extends BaseRoleAction {
	protected readonly roleKey: BaseRoleAction.RoleKey;
	protected readonly roleData: RoleData;
	protected readonly rolePermissions: RolePermissionOverwriteOption;

	public constructor(options: BasePreSetRoleAction.Options) {
		super(options);
		this.roleKey = options.roleKey;
		this.roleData = options.roleData;
		this.rolePermissions = options.rolePermissions;
	}

	protected async preHandle(options: BasePreSetRoleAction.RunOptions): Promise<BaseRoleAction.Context> {
		const roleID = await options.guild.readSettings(this.roleKey);
		if (isNullish(roleID)) this.throwMissingRole();

		const roles = options.guild.roles.cache;
		const role = roles.get(roleID);
		if (role === undefined) {
			await options.guild.writeSettings([[this.roleKey, null]]);
			this.throwMissingRole();
		}

		const excluded = await this.preHandleExcluded(options);
		return { role, excluded };
	}
}

export interface RolePermissionOverwriteOptionField {
	options: PermissionOverwriteOption;
	permissions: Permissions;
}

export interface RolePermissionOverwriteOption {
	category: RolePermissionOverwriteOptionField;
	text: RolePermissionOverwriteOptionField | null;
	voice: RolePermissionOverwriteOptionField | null;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BasePreSetRoleAction {
	export type RoleKey = BaseRoleAction.RoleKey;

	export interface Options extends BaseRoleAction.Options {
		roleKey: RoleKey;
		roleData: RoleData;
		rolePermissions: RolePermissionOverwriteOption;
	}

	export type Context = BaseRoleAction.Context;
	export type RunOptions = Omit<BaseRoleAction.RunOptions, 'role'>;
	export type PreHandledRunOptions = AttachPreHandledContext<RunOptions, Context>;
}
