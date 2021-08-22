import type { ScheduleEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand, SkyraPaginatedMessage } from '#lib/structures';
import { Schedules } from '#lib/types/Enums';
import { minutes } from '#utils/common';
import { sendLoadingMessage } from '#utils/util';
import { ApplyOptions, RequiresClientPermissions, RequiresGuildContext } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { chunk, cutText } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import { Message, MessageEmbed } from 'discord.js';

const enum Actions {
	List = 'list',
	Show = 'show',
	Create = 'create',
	Delete = 'delete'
}

interface ReminderScheduledTask extends ScheduleEntity {
	data: {
		content: string;
		user: string;
	};
}

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['rmm', 'remind', 'reminder', 'reminders'],
	description: LanguageKeys.Commands.Social.RemindMeDescription,
	extendedHelp: LanguageKeys.Commands.Social.RemindMeExtended
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const action = args.finished ? Actions.List : await args.pick(UserCommand.action).catch(() => Actions.Create);
		return this[action](message, args);
	}

	public async create(message: Message, args: SkyraCommand.Args) {
		const duration = await args.pick('timespan', { minimum: minutes(1) });
		const description = args.finished
			? args.t(LanguageKeys.Commands.Social.RemindMeCreateNoDescription)
			: await args.rest('string', { maximum: 1024 });

		const task = await this.container.schedule.add(Schedules.Reminder, Date.now() + duration, {
			catchUp: true,
			data: {
				content: description,
				user: message.author.id
			}
		});

		const content = args.t(LanguageKeys.Commands.Social.RemindMeCreate, { id: task.id.toString() });
		return send(message, content);
	}

	@RequiresGuildContext((message: Message, args: SkyraCommand.Args) => send(message, args.t(LanguageKeys.Preconditions.GuildOnly)))
	@RequiresClientPermissions(['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
	public async list(message: Message, args: SkyraCommand.Args) {
		const { client } = this.container;
		const tasks = client.schedules.queue.filter((task) => task.data && task.data.user === message.author.id);
		if (!tasks.length) {
			const content = args.t(LanguageKeys.Commands.Social.RemindMeListEmpty);
			return send(message, content);
		}
		const response = await sendLoadingMessage(message, args.t);

		const display = new SkyraPaginatedMessage({
			template: new MessageEmbed()
				.setColor(await this.container.db.fetchColor(message))
				.setAuthor(client.user!.username, client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
		});

		const pages = chunk(
			tasks.map(
				(task) =>
					`\`${task.id}\` - \`${args.t(LanguageKeys.Globals.DateTimeValue, { value: task.time })}\` - ${cutText(
						task.data.content as string,
						40
					)}`
			),
			10
		);

		for (const page of pages) display.addPageEmbed((embed) => embed.setDescription(page.join('\n')));
		await display.run(response, message.author);
		return response;
	}

	public async delete(message: Message, args: SkyraCommand.Args) {
		const task = await args.pick(UserCommand.task);
		const { id } = task;
		await task.delete();

		const content = args.t(LanguageKeys.Commands.Social.RemindMeDelete, { remainingDuration: task.time.getTime() - Date.now(), id });
		return send(message, content);
	}

	@RequiresClientPermissions(['EMBED_LINKS'])
	public async show(message: Message, args: SkyraCommand.Args) {
		const task = await args.pick(UserCommand.task);

		const embed = new MessageEmbed()
			.setColor(await this.container.db.fetchColor(message))
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setDescription(task.data.content)
			.setFooter(args.t(LanguageKeys.Commands.Social.RemindMeShowFooter, { id: task.id }))
			.setTimestamp(task.time);
		return send(message, { embeds: [embed] });
	}

	private static action = Args.make<Actions>((parameter, { argument }) => {
		switch (parameter.toLowerCase()) {
			case 'a':
			case 'all':
			case 'l':
			case 'list':
				return Args.ok(Actions.List);
			case 'r':
			case 'rm':
			case 'remove':
			case 'd':
			case 'del':
			case 'delete':
				return Args.ok(Actions.Delete);
			case 's':
			case 'show':
				return Args.ok(Actions.Show);
			case 'c':
			case 'create':
			case 'me':
				return Args.ok(Actions.Create);
			default: {
				return Args.error({ argument, parameter });
			}
		}
	});

	private static task = Args.make<ReminderScheduledTask>((parameter, { message, argument }) => {
		const id = Number(parameter);
		if (!Number.isInteger(id) || id < 0) {
			return Args.error({ argument, parameter, identifier: LanguageKeys.Commands.Social.RemindMeInvalidId });
		}

		for (const task of message.client.schedules.queue) {
			// If it is not the task we are looking for, skip:
			if (task.id !== id) continue;

			// If the specified task is:
			// - Not a reminder.
			// - Does not belong to the user.
			//
			// Then it should break the loop and return err.
			if (task.taskId !== Schedules.Reminder || task.data.user !== message.author.id) break;

			// But if the task is a valid one, is a reminder, and is owned by the author, then emit ok():
			return Args.ok(task as ReminderScheduledTask);
		}

		return Args.error({ argument, parameter, identifier: LanguageKeys.Commands.Social.RemindMeNotFound });
	});
}
