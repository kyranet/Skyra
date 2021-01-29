import { LanguageKeys } from '#lib/i18n/languageKeys';
import { FuzzySearch } from '#utils/Parsers/FuzzySearch';
import { RoleMentionRegex, SnowflakeRegex } from '@sapphire/discord.js-utilities';
import { Argument, ArgumentContext } from '@sapphire/framework';
import type { Guild, Role } from 'discord.js';

export class UserArgument extends Argument<Role> {
	public get role() {
		return this.store.get('role') as Argument<Role>;
	}

	public async run(argument: string, context: ArgumentContext, filter?: (entry: Role) => boolean) {
		const { message } = context;
		if (!message.guild) return this.role.run(argument, context);

		const resolvedRole = this.resolveRole(argument, message.guild);
		if (resolvedRole) return this.ok(resolvedRole);

		const result = await new FuzzySearch(message.guild.roles.cache, (entry) => entry.name, filter).run(message, argument, context.minimum);
		if (result) return this.ok(result[1]);
		return this.error(argument, LanguageKeys.Resolvers.InvalidRoleName);
	}

	public resolveRole(query: string, guild: Guild) {
		const role = RoleMentionRegex.exec(query) ?? SnowflakeRegex.exec(query);
		return role ? guild.roles.cache.get(role[1]) ?? null : null;
	}
}
