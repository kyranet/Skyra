import type { ReactionRole } from '@lib/types/namespaces/GuildSettings';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { isObject } from '@sapphire/utilities';
import { displayEmoji } from '@utils/util';
import { Guild } from 'discord.js';
import { Serializer, SerializerUpdateContext } from 'klasa';

export default class extends Serializer {
	public validate(data: ReactionRole, { language }: SerializerUpdateContext) {
		if (
			isObject(data) &&
			Object.keys(data).length === 4 &&
			typeof data.emoji === 'string' &&
			(typeof data.message === 'string' || data.message === null) &&
			typeof data.channel === 'string' &&
			typeof data.role === 'string'
		)
			return data;

		throw language.get(LanguageKeys.Serializers.ReactionRoleInvalid);
	}

	public stringify(value: ReactionRole, guild: Guild) {
		const emoji = displayEmoji(value.emoji);
		const role = guild.roles.cache.get(value.role)?.name ?? guild.language.get('unknownRole');
		const url = `https://discord.com/channels/${guild.id}/${value.channel}/${value.message}`;
		return `${emoji} | ${url} -> ${role}`;
	}
}
