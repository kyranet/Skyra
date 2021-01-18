import { AnalyticsSchema } from '#lib/types/AnalyticsSchema';
import { Events } from '#lib/types/Enums';
import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, MimeTypes, Route, RouteOptions } from '@sapphire/plugin-api';
import { isObject } from '@sapphire/utilities';

@ApplyOptions<RouteOptions>({ route: 'twitch/stream_change/:id' })
export default class extends Route {
	// Challenge
	public get(request: ApiRequest, response: ApiResponse) {
		const challenge = request.query['hub.challenge'] as string | undefined;
		switch (request.query['hub.mode']) {
			case 'denied':
				return response.setContentType(MimeTypes.TextPlain).ok(challenge ?? 'ok');
			case 'unsubscribe':
			case 'subscribe':
				return response.setContentType(MimeTypes.TextPlain).ok(challenge);
			default:
				return response.error("Well... Isn't this a pain in the ass");
		}
	}

	// Stream Changed
	public post(request: ApiRequest, response: ApiResponse) {
		if (!isObject(request.body)) return response.badRequest('Malformed data received');

		const xHubSignature = request.headers['x-hub-signature'];
		if (typeof xHubSignature === 'undefined') return response.badRequest('Missing "x-hub-signature" header');

		const [algo, sig] = xHubSignature.toString().split('=', 2);
		const { client } = this.context;
		if (!client.twitch.checkSignature(algo, sig, request.body)) return response.forbidden('Invalid Hub signature');

		const id = request.params.id as string;
		const { data } = request.body as PostStreamBody;
		const lengthStatus = data.length === 0;

		if (lengthStatus) {
			client.emit(Events.TwitchStreamHookedAnalytics, AnalyticsSchema.TwitchStreamStatus.Online);
			client.emit(Events.TwitchStreamOffline, { id }, response);
		} else {
			client.emit(Events.TwitchStreamHookedAnalytics, AnalyticsSchema.TwitchStreamStatus.Offline);
			client.emit(Events.TwitchStreamOnline, data[0], response);
		}
	}
}

export interface PostStreamBody {
	data: PostStreamBodyData[];
}

export interface PostStreamBodyData {
	game_id: string;
	id: string;
	language: string;
	started_at: string;
	tag_ids: string[] | null;
	thumbnail_url: string;
	title: string;
	type: string;
	user_id: string;
	user_name: string;
	viewer_count: number;
}
