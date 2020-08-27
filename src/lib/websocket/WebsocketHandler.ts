import Collection from '@discordjs/collection';
import { SkyraClient } from '@lib/SkyraClient';
import { ApiRequest, UserAuthObject } from '@lib/structures/api/ApiRequest';
import { CookieStore } from '@lib/structures/api/CookieStore';
import { DEV, WSS_PORT } from '@root/config';
import { isObject } from '@sapphire/utilities';
import { enumerable } from '@utils/util';
import { Util } from 'klasa-dashboard-hooks';
import WebSocket, { Server } from 'ws';
import { CloseCodes, WebsocketEvents } from './types';
import WebsocketUser from './WebsocketUser';

export class WebsocketHandler {
	public wss: Server;
	public users = new Collection<string, WebsocketUser>();

	@enumerable(false)
	public client: SkyraClient;

	public constructor(client: SkyraClient) {
		this.client = client;
		this.wss = new Server({ port: WSS_PORT });

		this.wss.on(WebsocketEvents.Connection, this.handleConnection.bind(this));
	}

	private handleConnection(ws: WebSocket, request: ApiRequest) {
		// Read SKYRA_AUTH cookie
		const cookies = new CookieStore(request, null!, !DEV);
		const auth = cookies.get('SKYRA_AUTH');
		if (!auth) return ws.close(CloseCodes.Unauthorized);

		// Decrypt and validate
		const authData = Util.decrypt(auth, this.client.options.clientSecret) as UserAuthObject;
		if (!isObject(authData) || !authData.user_id || !authData.token) return ws.close(CloseCodes.Unauthorized);

		// Retrieve the user ID
		const id = authData.user_id;

		// If they already have a connection with the same user ID, close the previous.
		const previous = this.users.get(id);
		if (previous) previous.connection.close(CloseCodes.DuplicatedConnection);

		// We have a new "user", add them to this.users
		const websocketUser = new WebsocketUser(this, ws, id);
		this.users.set(id, websocketUser);
	}
}
