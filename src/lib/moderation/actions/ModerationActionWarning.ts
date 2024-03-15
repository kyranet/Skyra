import { ModerationAction } from '#lib/moderation/actions/base/ModerationAction';
import { TypeVariation } from '#utils/moderationConstants';

export class ModerationActionWarning extends ModerationAction<number> {
	public constructor() {
		super({
			type: TypeVariation.RestrictedAttachment,
			actionKey: 'warning',
			logPrefix: 'Moderation => Warning'
		});
	}
}
