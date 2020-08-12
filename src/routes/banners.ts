import { ApiRequest } from '@lib/structures/api/ApiRequest';
import { ApiResponse } from '@lib/structures/api/ApiResponse';
import { DbSet } from '@lib/structures/DbSet';
import { ApplyOptions } from '@skyra/decorators';
import { ratelimit } from '@utils/util';
import { Route, RouteOptions } from 'klasa-dashboard-hooks';

@ApplyOptions<RouteOptions>({ route: 'banners' })
export default class extends Route {
	private kInternalCacheTTL = 300000;

	@ratelimit(2, 2500)
	public async get(_: ApiRequest, response: ApiResponse) {
		const { banners } = await DbSet.connect();
		const entries = await banners.find({ cache: this.kInternalCacheTTL });
		return response.json(entries);
	}
}
