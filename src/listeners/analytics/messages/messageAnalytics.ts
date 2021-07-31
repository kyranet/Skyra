import { AnalyticsListener } from '#lib/structures';
import { Events } from '#lib/types/Enums';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<AnalyticsListener.Options>({ event: Events.Message })
export class UserAnalyticsEvent extends AnalyticsListener {
	public run(): void {
		this.container.client.analytics!.messageCount++;
	}
}
