import type { DMChannel, Guild, GuildMember, NewsChannel, TextChannel } from 'discord.js';
import type { KlasaMessage } from 'klasa';

export interface GuildMessage extends KlasaMessage {
	channel: TextChannel | NewsChannel;
	readonly guild: Guild;
	readonly member: GuildMember;
}

export interface DMMessage extends KlasaMessage {
	channel: DMChannel;
	readonly guild: null;
	readonly member: null;
}

export type MessageAcknowledgeable = TextChannel | GuildMessage;
