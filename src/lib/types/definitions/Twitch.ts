import type { NonNullObject } from '@sapphire/utilities';

export const enum TwitchHelixUserType {
	Staff = 'staff',
	Admin = 'admin',
	GlobalMod = 'global_mod',
	Normal = ''
}

export const enum TwitchHelixBroadcasterType {
	Partner = 'partner',
	Affiliate = 'affiliate',
	Normal = ''
}

export interface TwitchHelixBearerToken {
	EXPIRE: number | null;

	TOKEN: string | null;
}

export interface TwitchHelixResponse<T> {
	data: T[];
}

export interface TwitchHelixOauth2Result {
	access_token: string;

	expires_in: number;

	refresh_token: string;

	scope: string;
}

export interface TwitchHelixUsersSearchResult {
	broadcaster_type: TwitchHelixBroadcasterType;

	description: string;

	display_name: string;

	email?: string;

	id: string;

	login: string;

	offline_image_url: string;

	profile_image_url: string;

	type: TwitchHelixUserType;

	view_count: number;
}

export interface TwitchHelixUserFollowsResult {
	/** In the format of YYYY-MM-DD[T]HH:mm:ssZ, so can be parsed to a Date */
	followed_at: string;

	/** The ID of the user following a streamer */
	from_id: string;

	/** The name of the user following a streamer */
	from_name: string;

	/** The ID of the channel that the user follows */
	to_id: string;

	/** The name of the channel that the user follows */
	to_name: string;
}

export interface TwitchHelixGameSearchResult {
	/** Template URL for the game’s box art. */
	box_art_url: string;

	/** ID of the game. */
	id: string;

	/** Name of the game. */
	name: string;
}

export interface TwitchHelixStreamsResult {
	/** Template URL for the game’s box art. */
	game_box_art_url?: string;

	/** ID of the game being played on the stream. */
	game_id: string;

	/** Name of the game being played. */
	game_name: string;

	/** Stream ID. */
	id: string;

	/** Indicates if the broadcaster has specified their channel contains mature content that may be inappropriate for younger audiences. */
	is_mature: boolean;

	/** Stream language. A language value is either the {@linkplain https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes ISO 639-1} two-letter code for a {@linkplain https://help.twitch.tv/s/article/languages-on-twitch#streamlang supported stream language} or “other”. */
	language: string;

	/** UTC timestamp. */
	started_at: Date;

	/** Shows tag IDs that apply to the stream. */
	tag_ids: string[];

	/** Thumbnail URL of the stream. All image URLs have variable width and height. You can replace `{width}` and `{height}` with any values to get that size image */
	thumbnail_url: string;

	/** Stream title. */
	title: string;

	/** Stream type: "live" or "" (in case of error). */
	type: string;

	/** ID of the user who is streaming. */
	user_id: string;

	/** Login of the user who is streaming. */
	user_login: string;

	/** Display name corresponding to {@link TwitchHelixStreamsResult.user_id}. */
	user_name: string;

	/** Number of viewers watching the stream at the time of the query. */
	viewer_count: number;
}

export enum TwitchEventSubTypes {
	StreamOnline = 'stream.online',
	StreamOffline = 'stream.offline'
}

export interface TwitchEventSubResult {
	condition: {
		broadcaster_user_id: string;
	};

	cost: number;

	created_at: string;

	id: string;

	status: string;

	transport: {
		method: string;
		callback: string;
	};

	type: TwitchEventSubTypes;

	version: string;
}

export interface TwitchEventSubVerificationMessage<T = NonNullObject> {
	challenge: string;

	event: TwitchEventSubEvent<T>;

	subscription: TwitchEventSubResult;
}

export type TwitchEventSubEvent<T = NonNullObject> = T & {
	broadcaster_user_id: string;
	broadcaster_user_login: string;
	broadcaster_user_name: string;
};

export type TwitchEventSubOnlineEvent = TwitchEventSubEvent<{
	id: string;
	type: 'live';
	started_at: string;
}>;

export interface TwitchOnlineEmbedData {
	embedImageUrl?: string;

	embedThumbnailUrl?: string;

	gameName?: string;

	language?: string;

	startedAt: Date;

	title: string;

	userName: string;

	viewerCount?: number;
}
