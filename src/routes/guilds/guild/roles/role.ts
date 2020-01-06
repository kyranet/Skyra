import ApiRequest from '@lib/structures/api/ApiRequest';
import ApiResponse from '@lib/structures/api/ApiResponse';
import { flattenRole } from '@utils/Models/ApiTransform';
import { authenticated, ratelimit } from '@utils/util';
import { Permissions } from 'discord.js';
import { Route, RouteStore } from 'klasa-dashboard-hooks';

const { FLAGS: { MANAGE_GUILD } } = Permissions;

export default class extends Route {

	public constructor(store: RouteStore, file: string[], directory: string) {
		super(store, file, directory, { route: 'guilds/:guild/roles/:role' });
	}

	@authenticated
	@ratelimit(2, 5000, true)
	public async get(request: ApiRequest, response: ApiResponse) {
		const guildID = request.params.guild;

		const guild = this.client.guilds.get(guildID);
		if (!guild) return response.error(400);

		const member = await guild.members.fetch(request.auth!.user_id).catch(() => null);
		if (!member) return response.error(400);

		const canManage = member.permissions.has(MANAGE_GUILD);
		if (!canManage) return response.error(401);

		const roleID = request.params.role;
		const role = guild.roles.get(roleID);
		return role ? response.json(flattenRole(role)) : response.error(404);
	}

}
