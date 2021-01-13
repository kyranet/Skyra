import { ApiRequest } from '#lib/api/ApiRequest';
import { ApiResponse } from '#lib/api/ApiResponse';
import { canManage } from '#lib/api/utils';
import { api } from '#lib/discord/Api';
import { flattenGuild } from '#lib/api/ApiTransformers';
import { authenticated, ratelimit } from '#utils/util';
import { ApplyOptions } from '@skyra/decorators';
import { Route, RouteOptions } from 'klasa-dashboard-hooks';

@ApplyOptions<RouteOptions>({ route: 'guilds/:guild' })
export default class extends Route {
	@authenticated()
	@ratelimit(2, 5000, true)
	public async get(request: ApiRequest, response: ApiResponse) {
		const guildID = request.params.guild;

		const guild = this.client.guilds.cache.get(guildID);
		if (!guild) return response.error(400);

		const member = await guild.members.fetch(request.auth!.user_id).catch(() => null);
		if (!member) return response.error(400);

		if (!(await canManage(guild, member))) return response.error(403);

		const emojis = await api(this.client).guilds(guildID).emojis.get();
		return response.json({ ...flattenGuild(guild), emojis });
	}
}
