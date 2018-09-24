const { Argument, FuzzySearch } = require('../index');
const ROLE_REGEXP = /^(?:<@&)?(\d{17,19})>?$/;

module.exports = class extends Argument {

	public get role() {
		return this.store.get('role');
	}

	public async run(arg, possible, msg, filter) {
		if (!arg) throw msg.language.get('RESOLVER_INVALID_ROLENAME', possible.name);
		if (!msg.guild) return this.role.run(arg, possible, msg);
		const resRole = this.resolveRole(arg, msg.guild);
		if (resRole) return resRole;

		const result = await new FuzzySearch(msg.guild.roles, (entry) => entry.name, filter).run(msg, arg);
		if (result) return result[1];
		throw msg.language.get('RESOLVER_INVALID_ROLENAME', possible.name);
	}

	public resolveRole(query, guild) {
		if (ROLE_REGEXP.test(query)) return guild.roles.get(ROLE_REGEXP.exec(query)[1]);
		return null;
	}

};
