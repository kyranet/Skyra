import { Permissions } from 'discord.js';
import { Route, RouteOptions } from 'klasa-dashboard-hooks';
import ApiRequest from '../../../../lib/structures/api/ApiRequest';
import ApiResponse from '../../../../lib/structures/api/ApiResponse';
import { flattenChannel } from '../../../../lib/util/Models/ApiTransform';
import { ApplyOptions, authenticated, ratelimit } from '../../../../lib/util/util';

const { FLAGS: { MANAGE_GUILD } } = Permissions;

@ApplyOptions<RouteOptions>({
	route: 'guilds/:guild/channels/:channel'
})
export default class extends Route {

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

		const channelID = request.params.channel;
		const channel = guild.channels.get(channelID);
		return channel ? response.json(flattenChannel(channel)) : response.error(404);
	}

}
