import { Schedules } from '#lib/types/Enums';
import { Moderation } from '#utils/constants';
import { BaseRoleAction, RoleAction } from './base';

export class ActionAddRole extends BaseRoleAction {
	public constructor() {
		super({
			task: Schedules.ModerationEndAddRole,
			roleAction: RoleAction.Add,
			type: Moderation.TypeCodes.AddRole
		});
	}
}
