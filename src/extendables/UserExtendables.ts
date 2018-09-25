// @ts-nocheck
const { Extendable, User } = require('../index');

export default class extends Extendable {

	public constructor(client: Skyra, store: ExtendableStore, file: string[], directory: string) {
		super(client, store, file, directory, { appliesTo: [User] });
	}

	public async fetchRank() {
		const list = await this.client.leaderboard.getUsers();

		const rank = list.get(this.id);
		if (!rank) return list.size;
		if (!rank.name) rank.name = this.username;
		return rank.position;
	}

}
