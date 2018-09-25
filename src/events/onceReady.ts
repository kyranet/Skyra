const { Event, klasaUtil } = require('../index');

export default class extends Event {

	public constructor(client: Skyra, store: EventStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			once: true,
			event: 'ready'
		});
	}

	public async run() {
		await this.client.fetchApplication();
		if (!this.client.options.ownerID) this.client.options.ownerID = this.client.application.owner.id;

		this.client.settings = this.client.gateways.clientStorage.get(this.client.user.id, true);
		// Added for consistency with other datastores, Client#clients does not exist
		this.client.gateways.clientStorage.cache.set(this.client.user.id, this.client);
		await Promise.all([
			this._prepareSkyra(),
			this.client.gateways.sync()
		]);

		// Init all the pieces
		await Promise.all(this.client.pieceStores.filter((store) => !['providers', 'extendables'].includes(store.name)).map((store) => store.init()));
		klasaUtil.initClean(this.client);
		this.client.ready = true;

		// Init the schedule
		await this.client.schedule.init();

		if (this.client.options.readyMessage !== null)
			this.client.emit('log', klasaUtil.isFunction(this.client.options.readyMessage) ? this.client.options.readyMessage(this.client) : this.client.options.readyMessage);

		this.client.emit('klasaReady');
	}

	public async _prepareSkyra() {
		// Fill the dictionary name for faster user fetching
		for (const guild of this.client.guilds.values()) {
			for (const member of guild.members.values())
				guild.nameDictionary.set(member.id, member.displayName);
		}

		// Sweep
		this.client.tasks.get('cleanup').run({});

		const promise = require('../lib/util/Games/Slotmachine').init();

		// Sync any settings instance
		const table = this.client.providers.default.db.table('localScores');
		const queue = [];

		const { guilds, user: { id: clientID } } = this.client;
		for (const guild of guilds.values()) {
			for (const member of guild.members.values())
				if (member.id !== clientID) queue.push([guild.id, member.id]);
		}
		this.client._skyraReady = true;
		const entries = await table.getAll(...queue, { index: 'guild_user' }).run();
		for (const entry of entries) guilds.get(entry.guildID).members.get(entry.userID).settings._patch(entry);

		await promise;
	}

}
