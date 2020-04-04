import Collection from '@discordjs/collection';
import { resolveOnErrorCodes } from '@utils/util';
import { api } from '@utils/Models/Api';
import { APIErrors, Time } from '@utils/constants';
import { APIInviteData } from '@lib/types/DiscordAPI';
import { Client } from 'discord.js';

export class InviteStore extends Collection<string, InviteCodeEntry> {

	private readonly client: Client;

	public constructor(client: Client) {
		super();
		this.client = client;
		this.client.setInterval(() => {
			const deleteAt = Date.now() - (Time.Minute * 15);
			this.sweep(value => value.fetchedAt < deleteAt);
		}, Time.Minute);
	}

	public async fetch(code: string) {
		const previous = this.get(code);
		if (typeof previous !== 'undefined') return previous;

		const data = await resolveOnErrorCodes(api(this.client).invites(code).get(), APIErrors.UnknownInvite) as APIInviteData | null;
		if (data === null) {
			const resolved: InviteCodeEntry = { valid: false, fetchedAt: Date.now() };
			this.set(code, resolved);
			return resolved;
		}

		const resolved: InviteCodeEntry = {
			valid: true,
			guildID: 'guild' in data ? data.guild.id : null,
			fetchedAt: Date.now()
		};
		this.set(code, resolved);
		return resolved;
	}

}

export type InviteCodeEntry = (InviteCodeInvalidEntry | InviteCodeValidEntry) & {
	fetchedAt: number;
};

export interface InviteCodeInvalidEntry {
	valid: false;
}

export interface InviteCodeValidEntry {
	valid: true;
	guildID: string | null;
}
