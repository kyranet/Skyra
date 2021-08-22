import {
	TwitchHelixOauth2Result,
	TwitchEventSubResult,
	TwitchHelixBearerToken,
	TwitchHelixResponse,
	TwitchHelixUserFollowsResult,
	TwitchHelixUsersSearchResult,
	TwitchEventSubTypes,
	TwitchHelixStreamsResult,
	TwitchHelixGameSearchResult
} from '#lib/types/definitions/Twitch';
import { Enumerable, EnumerableMethod } from '@sapphire/decorators';
import { fetch, FetchMethods, FetchResultTypes } from '@sapphire/fetch';
import { MimeTypes } from '@sapphire/plugin-api';
import { RateLimitManager } from '@sapphire/ratelimits';
import { Time } from '@sapphire/time-utilities';
import { URL } from 'url';
import { createHmac } from 'crypto';

export class Twitch {
	public readonly ratelimitsStreams = new RateLimitManager(Time.Minute * 3000, 1);
	public readonly BASE_URL_HELIX = 'https://api.twitch.tv/helix';
	public readonly BRANDING_COLOUR = 0x6441a4;

	@Enumerable(false)
	private BEARER: TwitchHelixBearerToken = {
		EXPIRE: null,
		TOKEN: null
	};

	@Enumerable(false)
	private readonly clientId = process.env.TWITCH_CLIENT_ID;

	@Enumerable(false)
	private readonly clientSecret = process.env.TWITCH_TOKEN;

	@Enumerable(false)
	private readonly eventSubSecret = process.env.TWITCH_EVENTSUB_SECRET;

	@Enumerable(false)
	private readonly kTwitchRequestHeaders = {
		'Content-Type': MimeTypes.ApplicationJson,
		Accept: MimeTypes.ApplicationJson,
		'Client-ID': this.clientId
	};

	public streamNotificationDrip(id: string) {
		try {
			this.ratelimitsStreams.acquire(id).consume();
			return false;
		} catch {
			return true;
		}
	}

	public async fetchUsers(ids: Iterable<string> = [], logins: Iterable<string> = []) {
		const search: string[] = [];
		for (const id of ids) search.push(`id=${encodeURIComponent(id)}`);
		for (const login of logins) search.push(`login=${encodeURIComponent(login)}`);
		return this._performApiGETRequest<TwitchHelixResponse<TwitchHelixUsersSearchResult>>(`users?${search.join('&')}`);
	}

	public async fetchStream(broadcasterUserId: string): Promise<TwitchHelixStreamsResult | null> {
		const search = `user_id=${encodeURIComponent(broadcasterUserId)}`;
		const streamResult = await this._performApiGETRequest<TwitchHelixResponse<TwitchHelixStreamsResult>>(`streams?${search}`);
		const streamData = streamResult.data?.[0];

		if (streamData) {
			const gameSearch = `id=${encodeURIComponent(streamData.game_id)}`;
			const gameResult = await this._performApiGETRequest<TwitchHelixResponse<TwitchHelixGameSearchResult>>(`games?${gameSearch}`);
			const gameData = gameResult.data?.[0];

			if (gameData) {
				return {
					...streamData,
					game_box_art_url: gameData.box_art_url
				};
			}
		}

		return streamData ?? null;
	}

	public async fetchUserFollowage(userId: string, channelId: string) {
		return this._performApiGETRequest<TwitchHelixResponse<TwitchHelixUserFollowsResult> & { total: number }>(
			`users/follows?from_id=${userId}&to_id=${channelId}`
		);
	}

	public checkSignature(algorithm: string, signature: string, data: any) {
		const hash = createHmac(algorithm, this.eventSubSecret).update(data).digest('hex');

		return hash === signature;
	}

	public fetchBearer() {
		const { TOKEN, EXPIRE } = this.BEARER;
		if (!EXPIRE || !TOKEN) return this._generateBearerToken();
		if (Date.now() > EXPIRE) return this._generateBearerToken();
		return TOKEN;
	}

	/**
	 * Adds a new Twitch subscription
	 */
	public async subscriptionsStreamHandle(
		streamerId: string,
		subscriptionType: TwitchEventSubTypes = TwitchEventSubTypes.StreamOnline
	): Promise<string> {
		const subscription = await fetch<TwitchHelixResponse<TwitchEventSubResult>>(
			`${this.BASE_URL_HELIX}/eventsub/subscriptions`,
			{
				body: JSON.stringify({
					type: subscriptionType,
					version: '1',
					condition: {
						broadcaster_user_id: streamerId
					},
					transport: {
						method: 'webhook',
						callback: process.env.TWITCH_CALLBACK,
						secret: this.eventSubSecret
					}
				}),
				headers: {
					...this.kTwitchRequestHeaders,
					Authorization: `Bearer ${await this.fetchBearer()}`
				},
				method: FetchMethods.Post
			},
			FetchResultTypes.JSON
		);

		return subscription.data[0].id;
	}

	/**
	 * Removes a Twitch subscription based on its ID
	 * @param subscriptionId the ID to remove
	 */
	public async removeSubscription(subscriptionId: string): Promise<void> {
		const url = new URL(`${this.BASE_URL_HELIX}/eventsub/subscriptions`);
		url.searchParams.append('id', subscriptionId);

		await fetch<TwitchHelixResponse<TwitchEventSubResult>>(
			url,
			{
				headers: {
					...this.kTwitchRequestHeaders,
					Authorization: `Bearer ${await this.fetchBearer()}`
				},
				method: FetchMethods.Delete
			},
			FetchResultTypes.Result
		);
	}

	@EnumerableMethod(false)
	// @ts-expect-error This is a convenience function for eval-ling
	private async getCurrentTwitchSubscriptions(): Promise<TwitchHelixResponse<TwitchEventSubResult>> {
		return this._performApiGETRequest<TwitchHelixResponse<TwitchEventSubResult>>('eventsub/subscriptions');
	}

	private async _performApiGETRequest<T>(path: string): Promise<T> {
		return fetch<T>(
			`${this.BASE_URL_HELIX}/${path}`,
			{
				headers: {
					...this.kTwitchRequestHeaders,
					Authorization: `Bearer ${await this.fetchBearer()}`
				}
			},
			FetchResultTypes.JSON
		);
	}

	private async _generateBearerToken() {
		const url = new URL('https://id.twitch.tv/oauth2/token');
		url.searchParams.append('client_secret', this.clientSecret);
		url.searchParams.append('client_id', this.clientId);
		url.searchParams.append('grant_type', 'client_credentials');
		const response = await fetch<TwitchHelixOauth2Result>(url.href, { method: FetchMethods.Post }, FetchResultTypes.JSON);
		const expires = Date.now() + response.expires_in * 1000;
		this.BEARER = { TOKEN: response.access_token, EXPIRE: expires };
		return response.access_token;
	}
}
