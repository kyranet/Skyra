import * as GuildSettings from '#lib/database/keys/settings/All';
import { readSettings } from '#lib/database/settings';
import type { SkyraCommand } from '#lib/structures';
import { createFunctionPrecondition } from '@sapphire/decorators';
import { container } from '@sapphire/framework';
import { ApiRequest, ApiResponse, HttpCodes, LoginData } from '@sapphire/plugin-api';
import { RateLimitManager } from '@sapphire/ratelimits';
import { hasAtLeastOneKeyInMap } from '@sapphire/utilities';
import type { RESTAPIPartialCurrentUserGuild } from 'discord-api-types/v8';
import { Client, Guild, GuildMember, Permissions } from 'discord.js';
import { flattenGuild } from './ApiTransformers';
import type { OauthFlattenedGuild, PartialOauthFlattenedGuild, TransformedLoginData } from './types';

function isAdmin(member: GuildMember, roles: readonly string[]): boolean {
	return roles.length === 0 ? member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) : hasAtLeastOneKeyInMap(member.roles.cache, roles);
}

export const authenticated = () =>
	createFunctionPrecondition(
		(request: ApiRequest) => Boolean(request.auth?.token),
		(_request: ApiRequest, response: ApiResponse) => response.error(HttpCodes.Unauthorized)
	);

/**
 * @param time The amount of milliseconds for the ratelimits from this manager to expire.
 * @param limit The amount of times a {@link RateLimit} can drip before it's limited.
 * @param auth Whether or not this should be auth-limited
 */
export function ratelimit(time: number, limit = 1, auth = false) {
	const manager = new RateLimitManager(time, limit);
	const xRateLimitLimit = time;
	return createFunctionPrecondition(
		(request: ApiRequest, response: ApiResponse) => {
			const id = (auth ? request.auth!.id : request.headers['x-forwarded-for'] || request.connection.remoteAddress) as string;
			const bucket = manager.acquire(id);

			response.setHeader('Date', new Date().toUTCString());
			if (bucket.limited) {
				response.setHeader('Retry-After', bucket.remainingTime.toString());
				return false;
			}

			try {
				bucket.consume();
			} catch {}

			response.setHeader('X-RateLimit-Limit', xRateLimitLimit);
			response.setHeader('X-RateLimit-Remaining', bucket.remaining.toString());
			response.setHeader('X-RateLimit-Reset', bucket.remainingTime.toString());

			return true;
		},
		(_request: ApiRequest, response: ApiResponse) => {
			response.error(HttpCodes.TooManyRequests);
		}
	);
}

export async function canManage(guild: Guild, member: GuildMember): Promise<boolean> {
	if (guild.ownerId === member.id) return true;

	const [roles, pnodes] = await readSettings(guild, (settings) => [settings[GuildSettings.Roles.Admin], settings.permissionNodes]);

	return isAdmin(member, roles) && (pnodes.run(member, container.stores.get('commands').get('conf') as SkyraCommand) ?? true);
}

export async function getManageable(id: string, oauthGuild: RESTAPIPartialCurrentUserGuild, guild: Guild | undefined): Promise<boolean> {
	if (oauthGuild.owner) return true;
	if (typeof guild === 'undefined') return new Permissions(BigInt(oauthGuild.permissions)).has(Permissions.FLAGS.MANAGE_GUILD);

	const member = await guild.members.fetch(id).catch(() => null);
	if (!member) return false;

	return canManage(guild, member);
}

export async function transformGuild(client: Client, userId: string, data: RESTAPIPartialCurrentUserGuild): Promise<OauthFlattenedGuild> {
	const guild = client.guilds.cache.get(data.id);
	const serialized: PartialOauthFlattenedGuild =
		typeof guild === 'undefined'
			? {
					afkChannelId: null,
					afkTimeout: 0,
					applicationId: null,
					approximateMemberCount: null,
					approximatePresenceCount: null,
					available: true,
					banner: null,
					channels: [],
					defaultMessageNotifications: 'ONLY_MENTIONS',
					description: null,
					widgetEnabled: false,
					explicitContentFilter: 'DISABLED',
					icon: data.icon,
					id: data.id,
					joinedTimestamp: null,
					mfaLevel: 'NONE',
					name: data.name,
					ownerId: data.owner ? userId : null,
					partnered: false,
					preferredLocale: 'en-US',
					premiumSubscriptionCount: null,
					premiumTier: 'NONE',
					roles: [],
					splash: null,
					systemChannelId: null,
					vanityURLCode: null,
					verificationLevel: 'NONE',
					verified: false
			  }
			: flattenGuild(guild);

	return {
		...serialized,
		permissions: data.permissions,
		manageable: await getManageable(userId, data, guild),
		skyraIsIn: typeof guild !== 'undefined'
	};
}

export async function transformOauthGuildsAndUser({ user, guilds }: LoginData): Promise<TransformedLoginData> {
	if (!user || !guilds) return { user, guilds };

	const { client } = container;
	const userId = user.id;

	const transformedGuilds = await Promise.all(guilds.map((guild) => transformGuild(client, userId, guild)));
	return { user, transformedGuilds };
}
