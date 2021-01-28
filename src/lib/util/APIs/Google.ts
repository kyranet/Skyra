import { LanguageKeys } from '#lib/i18n/languageKeys';
import type { CustomGet } from '#lib/types';
import { TOKENS } from '#root/config';
import { Store } from '@sapphire/framework';
import type { Message } from 'discord.js';
import { fetch, FetchResultTypes } from '../util';

const GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_CUSTOM_SEARCH_API_URL = 'https://www.googleapis.com/customsearch/v1';

export const enum CustomSearchType {
	Image,
	Search
}

export const enum GoogleResponseCodes {
	ZeroResults = 'ZERO_RESULTS',
	RequestDenied = 'REQUEST_DENIED',
	InvalidRequest = 'INVALID_REQUEST',
	OverQueryLimit = 'OVER_QUERY_LIMIT',
	UnknownError = 'UNKNOWN_ERROR',
	PermissionDenied = 'PERMISSION_DENIED',
	Ok = 'OK',
	Failed = 'FAILED'
}

export async function queryGoogleMapsAPI(message: Message, location: string) {
	const url = new URL(GOOGLE_MAPS_API_URL);
	url.searchParams.append('address', location);
	url.searchParams.append('key', TOKENS.GOOGLE_MAPS_API_KEY);
	const { results, status } = await fetch<GoogleMapsResultOk>(url, FetchResultTypes.JSON);

	if (status !== GoogleResponseCodes.Ok) throw await message.resolveKey(handleNotOK(status));
	if (results.length === 0) throw await message.resolveKey(LanguageKeys.Commands.Google.MessagesErrorZeroResults);

	return {
		formattedAddress: results[0].formatted_address,
		lat: results[0].geometry.location.lat,
		lng: results[0].geometry.location.lng,
		addressComponents: results[0].address_components
	};
}

export async function queryGoogleCustomSearchAPI<T extends CustomSearchType>(message: Message, type: T, query: string) {
	try {
		const nsfwAllowed = message.channel.type === 'text' ? message.channel.nsfw : true;
		const url = new URL(GOOGLE_CUSTOM_SEARCH_API_URL);
		url.searchParams.append('cx', type === CustomSearchType.Search ? TOKENS.GOOGLE_CUSTOM_SEARCH_WEB_KEY : TOKENS.GOOGLE_CUSTOM_SEARCH_IMAGE_KEY);
		url.searchParams.append('key', TOKENS.GOOGLE_API_KEY);
		url.searchParams.append('q', query);
		url.searchParams.append('safe', nsfwAllowed ? 'off' : 'active');
		if (type === CustomSearchType.Image) url.searchParams.append('searchType', 'image');

		return await fetch<GoogleSearchResult<T>>(url, FetchResultTypes.JSON);
	} catch (err) {
		const { error } = err.toJSON() as GoogleResultError;
		throw await message.resolveKey(handleNotOK(error.status));
	}
}

export function handleNotOK(status: GoogleResponseCodes): CustomGet<string, string> {
	switch (status) {
		case GoogleResponseCodes.ZeroResults:
			return LanguageKeys.Commands.Google.MessagesErrorZeroResults;
		case GoogleResponseCodes.RequestDenied:
			return LanguageKeys.Commands.Google.MessagesErrorRequestDenied;
		case GoogleResponseCodes.InvalidRequest:
			return LanguageKeys.Commands.Google.MessagesErrorInvalidRequest;
		case GoogleResponseCodes.OverQueryLimit:
			return LanguageKeys.Commands.Google.MessagesErrorOverQueryLimit;
		case GoogleResponseCodes.PermissionDenied:
			Store.injectedContext.client.logger.fatal('Google::handleNotOK | Permission Denied');
			return LanguageKeys.Commands.Google.MessagesErrorPermissionDenied;
		default:
			Store.injectedContext.client.logger.fatal(`Google::handleNotOK | Unknown Error: ${status}`);
			return LanguageKeys.Commands.Google.MessagesErrorUnknown;
	}
}

export interface GoogleMapsResultOk {
	results: GoogleMapsResultOkResult[];
	status: GoogleResponseCodes;
}

export interface GoogleMapsResultOkResult {
	address_components: GoogleMapsOkAddressComponent[];
	formatted_address: string;
	geometry: GoogleMapsOkGeometry;
	place_id: string;
	types: string[];
}

export interface GoogleMapsOkAddressComponent {
	long_name: string;
	short_name: string;
	types: string[];
}

export interface GoogleMapsOkGeometry {
	bounds: GoogleMapsOkBounds;
	location: GoogleMapsOkLocation;
	location_type: string;
	viewport: GoogleMapsOkBounds;
}

export interface GoogleMapsOkBounds {
	northeast: GoogleMapsOkLocation;
	southwest: GoogleMapsOkLocation;
}

export interface GoogleMapsOkLocation {
	lat: number;
	lng: number;
}

export interface GoogleSearchResult<T extends CustomSearchType> {
	kind: string;
	context: { title: string };
	items?: T extends CustomSearchType.Image ? GoogleCSEImageData[] : GoogleCSEItem[];
}

export interface GoogleCSEImageData {
	displayLink: string;
	htmlSnippet: string;
	htmlTitle: string;
	kind: string;
	link: string;
	mime: string;
	snippet: string;
	title: string;
	image: GoogleImage;
}

export interface GoogleCSEItem {
	cacheId: string;
	displayLink: string;
	formattedUrl: string;
	htmlFormattedUrl: string;
	htmlSnippet: string;
	htmlTitle: string;
	kind: string;
	link: string;
	snippet: string;
	title: string;
	pagemap?: {
		cse_image?: GoogleCSEImage[];
		cse_thumbnail?: GoogleCSEImage[];
	};
}

interface GoogleCSEImage {
	src: string;
	height?: string;
	width?: string;
}

interface GoogleImage {
	byteSize: number;
	contextLink: string;
	height: number;
	thumbnailHeight: number;
	thumbnailLink: string;
	thumbnailWidth: number;
	width: number;
}

export interface GoogleResultError {
	error: GoogleResultErrorData;
}

export interface GoogleResultErrorData {
	code: number;
	errors: GoogleResultErrorDataErrorEntry[];
	message: string;
	status: GoogleResponseCodes;
}

export interface GoogleResultErrorDataErrorEntry {
	code: number;
}
