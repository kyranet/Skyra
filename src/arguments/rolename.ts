import { Role } from 'discord.js';
import { Argument, KlasaGuild, KlasaMessage, Possible } from 'klasa';
import { FuzzySearch } from '../lib/util/FuzzySearch';
const ROLE_REGEXP = /^(?:<@&)?(\d{17,19})>?$/;

export default class extends Argument {

	public get role() {
		return this.store.get('role');
	}

	public async run(arg: string, possible: Possible, message: KlasaMessage, filter?: (entry: Role) => boolean) {
		if (!arg) throw message.language.get('RESOLVER_INVALID_ROLENAME', possible.name);
		if (!message.guild) return this.role.run(arg, possible, message);
		const resRole = this.resolveRole(arg, message.guild);
		if (resRole) return resRole;

		const result = await new FuzzySearch(message.guild!.roles, entry => entry.name, filter).run(message, arg);
		if (result) return result[1];
		throw message.language.get('RESOLVER_INVALID_ROLENAME', possible.name);
	}

	public resolveRole(query: string, guild: KlasaGuild) {
		if (ROLE_REGEXP.test(query)) return guild!.roles.get(ROLE_REGEXP.exec(query)![1]);
		return null;
	}

}
