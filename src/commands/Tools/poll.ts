import { CommandStore, KlasaClient, KlasaMessage, Serializer } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { Events } from '../../lib/types/Enums';

const REG_USERS = Serializer.regex.userOrMember, REG_TAG = /[^#]{2,32}#\d{4,4}/;
const REG_ROLES = Serializer.regex.role;

export default class extends SkyraCommand {

	public userPrompt = this.definePrompt('<user:username> [...]', ',');
	public rolePrompt = this.definePrompt('<user:rolename> [...]', ',');
	public timePrompt = this.definePrompt('<time:time>');

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			cooldown: 15,
			description: (language) => language.get('COMMAND_POLL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_POLL_EXTENDED'),
			quotedStringSupport: true,
			runIn: ['text'],
			subcommands: true,
			usage: '<create|list|remove|vote|result> [parameters:string] [...]',
			usageDelim: ' '
		});
	}

	public async create(message: KlasaMessage, raw: string[]) {
		if (!raw.length) throw message.language.get('COMMAND_POLL_MISSING_TITLE');
		const [time] = await this.timePrompt.createPrompt(message).run(message.language.get('COMMAND_POLL_TIME'));
		const title = raw.join(' ');

		let users = null, roles = null, options = null;

		if ('users' in message.flags && message.flags.users !== 'users') {
			users = this._resolveUsers(message, message.flags.users.split(',').map((user) => user.trim()));
		} else if (!('no-prompt' in message.flags)) {
			const wants = await message.ask(message.language.get('COMMAND_POLL_WANT_USERS'));
			if (wants) users = await this.userPrompt.createPrompt(message).run(message.language.get('COMMAND_POLL_FIRSTUSER')).catch(() => null);
		}

		if ('roles' in message.flags && message.flags.roles !== 'roles') {
			roles = this._resolveRoles(message, message.flags.roles.split(',').map((role) => role.trim()));
		} else if (!('no-prompt' in message.flags)) {
			const wants = await message.ask(message.language.get('COMMAND_POLL_WANT_ROLES'));
			if (wants) roles = await this.rolePrompt.createPrompt(message).run(message.language.get('COMMAND_POLL_FIRSTROLE')).catch(() => null);
		}

		options = 'options' in message.flags && message.flags.options !== 'options'
			? message.flags.options.split(',').map((option) => option.trim().toLowerCase())
			: ['yes', 'no'];

		const data = {
			author: message.author.id,
			guild: message.guild.id,
			options,
			roles: roles ? roles.map((role) => role.id) : null,
			timestamp: time.getTime(),
			title,
			users: users ? users.map((user) => user.id) : null,
			voted: [],
			votes: options.reduce((acc, cur) => ({...acc,  [cur]: 0}), {})
		};
		const task = await this.client.schedule.create('poll', time, { catchUp: true, data });

		return message.sendMessage(message.language.get('COMMAND_POLL_CREATE', title,
			roles ? roles.map((role) => role.name) : null,
			users ? users.map((user) => user.username) : null,
			options,
			data.timestamp - Date.now(),
			task.id
		), { code: 'http' });
	}

	public list(message: KlasaMessage) {
		const polls = this.client.schedule.tasks.filter((task) => task.taskName === 'poll' && this._accepts(message, task.data));
		return message.sendMessage(polls.length ? polls.map((entry) => `ID: \`${entry.id}\` *${entry.data.title}*`) : message.language.get('COMMAND_POLL_LIST_EMPTY'));
	}

	public async remove(message: KlasaMessage, [id]: [string]) {
		if (!id) throw message.language.get('COMMAND_POLL_MISSING_ID');
		const found = this.client.schedule.get(id);
		if (!found || found.taskName !== 'poll' || found.data.guild !== message.guild.id) throw message.language.get('COMMAND_POLL_NOTEXISTS');
		if (!(message.author.id === found.data.author || await message.hasAtLeastPermissionLevel(7))) throw message.language.get('COMMAND_POLL_NOTMANAGEABLE');
		await found.delete();
		return message.sendLocale('COMMAND_POLL_REMOVE');
	}

	public async vote(message: KlasaMessage, [id, option]: [string, string]) {
		if (!id) throw message.language.get('COMMAND_POLL_MISSING_ID');
		if (message.deletable) message.nuke().catch((error) => this.client.emit(Events.ApiError, error));
		const found = this.client.schedule.get(id);
		if (!found || found.taskName !== 'poll' || found.data.guild !== message.guild.id) throw message.language.get('COMMAND_POLL_NOTEXISTS');
		if (found.data.voted.includes(message.author.id)) throw message.language.get('COMMAND_POLL_ALREADY_VOTED');
		if (option) option = option.toLowerCase();
		if (!option || !found.data.options.includes(option)) throw message.language.get('COMMAND_POLL_INVALID_OPTION', found.data.options.map((opt) => `\`${opt}\``).join(', '));
		found.data.votes[option]++;
		found.data.voted.push(message.author.id);
		await found.update({ data: found.data });
		return message.channel.send(message.language.get('COMMAND_POLL_VOTE')).then((m: KlasaMessage) => m.nuke(10000));
	}

	public async result(message: KlasaMessage, [id]: [string]) {
		if (!id) throw message.language.get('COMMAND_POLL_MISSING_ID');
		const poll = this.client.schedule.get(id);
		if (!(poll && (poll.taskName === 'poll' || poll.taskName === 'pollEnd') && poll.data.guild === message.guild.id)) throw message.language.get('COMMAND_POLL_NOTEXISTS');
		if (!(message.author.id === poll.data.author || await message.hasAtLeastPermissionLevel(7))) throw message.language.get('COMMAND_POLL_NOTMANAGEABLE');

		const { title, options, votes, voted } = poll.data;
		if (!voted.length) return message.sendLocale('COMMAND_POLL_EMPTY_VOTES');

		const maxLengthNames = options.reduce((acc, opt) => opt.length > acc ? opt.length : acc, 0);
		const graph = [];
		for (const opt of options) {
			const percentage = Math.round((votes[opt] / voted.length) * 100);
			graph.push(`${opt.padEnd(maxLengthNames, ' ')} : [${'#'.repeat((percentage / 100) * 25).padEnd(25, ' ')}] (${percentage}%)`);
		}
		return message.sendMessage([`Entry ID: '${poll.id}' (${title})`, ...graph].join('\n'), { code: 'http' });
	}

	public async _resolveRoles(message: KlasaMessage, roles: string[]) {
		const output = [];
		for (const role of roles) {
			const resolved = REG_ROLES.test(role)
				? message.guild.roles.get(REG_ROLES.exec(role)[1])
				: message.guild.roles.find((r) => r.name === role);

			if (resolved) output.push(resolved.id);
		}

		return output;
	}

	public async _resolveUsers(message: KlasaMessage, users: string[]) {
		const output = [];
		for (const user of users) {
			let resolved;
			if (REG_USERS.test(user)) resolved = await message.guild.members.fetch(REG_USERS.exec(user)[1]);
			else if (REG_TAG.test(user)) resolved = message.guild.memberTags.findKey((tag) => tag === user);
			else resolved = message.guild.memberUsernames.findKey((tag) => tag === user);

			if (resolved) output.push(resolved.id);
		}

		return output;
	}

	public _accepts(message: KlasaMessage, { users, roles }: { users: string[]; roles: string[] }) {
		return (users && users.includes(message.author.id)) || (roles && roles.some((role) => message.member.roles.has(role))) || !!users;
	}

}
