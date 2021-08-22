import { Store } from '@sapphire/framework';
import { InteractionHandler } from './InteractionHandler';

export class InteractionHandlerStore extends Store<InteractionHandler> {
	/**
	 * Constructs our InteractionHandlerStore for use in Skyra
	 * @param client The client that instantiates this store
	 */
	public constructor() {
		super(InteractionHandler as any, { name: 'interactions' });
		this.container.stores.register(this);
	}
}
