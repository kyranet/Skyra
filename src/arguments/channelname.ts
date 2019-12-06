import { GuildChannel, TextChannel, Permissions } from 'discord.js';
import { Argument, KlasaGuild, KlasaMessage, Possible } from 'klasa';
import { FuzzySearch } from '../lib/util/FuzzySearch';
const CHANNEL_REGEXP = /^(?:<#)?(\d{17,19})>?$/;

export default class extends Argument {

	public get channel() {
		return this.store.get('channel')!;
	}

	public async run(arg: string, possible: Possible, message: KlasaMessage, filter?: (entry: GuildChannel) => boolean): Promise<GuildChannel> {
		if (!arg) throw message.language.tget('RESOLVER_INVALID_CHANNELNAME', possible.name);
		if (!message.guild) return this.channel.run(arg, possible, message);
		const resChannel = this.resolveChannel(arg, message.guild);
		if (resChannel && (typeof filter === 'undefined' || filter(resChannel))) return this.validateAccess(resChannel, message);

		const result = await new FuzzySearch(message.guild.channels, entry => entry.name, filter).run(message, arg, possible.min || undefined);
		if (result) return this.validateAccess(result[1], message);
		throw message.language.tget('RESOLVER_INVALID_CHANNELNAME', possible.name);
	}

	public resolveChannel(query: string, guild: KlasaGuild) {
		if (CHANNEL_REGEXP.test(query)) return guild.channels.get(CHANNEL_REGEXP.exec(query)![1]);
		return null;
	}

	private validateAccess(channel: GuildChannel, message: KlasaMessage) {
		if (channel instanceof TextChannel && channel.permissionsFor(message.author)?.has(Permissions.FLAGS.VIEW_CHANNEL)) {
			return channel;
		}

		throw message.language.tget('SYSTEM_CANNOT_ACCESS_CHANNEL');
	}

}
