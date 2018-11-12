const { Task } = require('klasa');

module.exports = class extends Task {

	async run() {
		const { id, amount } = await this.client.jackpot.draw();
		if (id === null) return;

		const user = await this.client.users.fetch(id).catch(() => null);
		if (user === null) return;

		await user.settings.update('money', user.settings.money + amount);
		user.send(`Hey! You just won the jackpot for: ${amount}!`).catch(() => null);
	}

};
