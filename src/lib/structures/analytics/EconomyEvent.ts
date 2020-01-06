import { EventOptions, EventStore } from 'klasa';
import { Events } from '@lib/types/Enums';
import { Databases } from '@lib/types/influxSchema/database';
import BaseAnalyticsEvent from './BaseAnalyticsEvent';

export type PossibleEvents =
	Events.MoneyTransaction
	| Events.MoneyPayment;

export interface EconomyEventOptions extends EventOptions {
	event: PossibleEvents;
}

export default abstract class EconomyEvent extends BaseAnalyticsEvent {

	public event!: PossibleEvents;

	public DATABASE = Databases.Economy;

	public constructor(store: EventStore, file: string[], directory: string, options?: EconomyEventOptions) {
		super(store, file, directory, options);
	}

}
