const { Settings } = require('klasa');

/**
 * The UserSettings class that manages per-user settings
 * @since 1.6.0
 * @version 6.0.0
 * @extends {Settings}
 */
class UserSettings extends Settings {

	public get level() {
		return Math.floor(0.2 * Math.sqrt(this.points));
	}

	public win(money, guild) {
		if (guild) money *= guild.settings.social.boost;
		return this.add(money);
	}

	public add(money) {
		this.money += money;
		return this.update('money', this.money).then(() => this.money);
	}

	public use(money) {
		if (this.money < money) {
			const error = new Error(`[FAILSAFE] ${this} | Cannot get a debt.`);
			this.client.emit('wtf', error);
			throw error;
		}
		return this.update('money', this.money - money).then(() => this.money);
	}

}

module.exports = UserSettings;
