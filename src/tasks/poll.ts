import { RawPollSettings } from '@commands/Tools/poll';
import { APIErrors } from '@utils/constants';
import { DiscordAPIError } from 'discord.js';
import { constants, Task, util } from 'klasa';
const TASK_EOL = constants.TIME.DAY * 2;

export default class extends Task {

	public async run(poll: RawPollSettings & { id: string }) {
		const guild = this.client.guilds.get(poll.guild_id);
		if (!guild) return;

		const user = await this.client.users.fetch(poll.author_id).catch(error => this._catchErrorUser(error));
		if (!user) return;

		let content: string;
		const { title, options, votes, voted } = poll;
		if (voted.length) {
			const maxLengthNames = options.reduce((acc, opt) => opt.length > acc ? opt.length : acc, 0);
			const graph: string[] = [];
			for (const opt of options) {
				const percentage = Math.round((votes[opt] / voted.length) * 100);
				graph.push(`${opt.padEnd(maxLengthNames, ' ')} : [${'#'.repeat((percentage / 100) * 25).padEnd(25, ' ')}] (${percentage}%)`);
			}
			content = `Hey! Your poll __${title}__ with ID \`${poll.id}\` just finished, check the results!${
				util.codeBlock('http', [`Entry ID: '${poll.id}' (${title})`, ...graph].join('\n'))}`;
		} else {
			content = `Hey! Your poll __${title}__ with ID \`${poll.id}\` just finished, but nobody voted :(`;
		}

		await user.send(content).catch(error => this._catchErrorMessage(error));
		await this.client.schedule.create('pollEnd', Date.now() + TASK_EOL, { catchUp: true, data: poll });
	}

	public _catchErrorUser(error: DiscordAPIError): void {
		if (error.code === APIErrors.UnknownUser) return;
		throw error;
	}

	public _catchErrorMessage(error: DiscordAPIError): void {
		if (error.code === APIErrors.CannotMessageUser) return;
		throw error;
	}

}
