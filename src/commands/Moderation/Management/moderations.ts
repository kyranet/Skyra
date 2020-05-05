import { Collection } from '@discordjs/collection';
import { ModerationManagerEntry } from '@lib/structures/ModerationManagerEntry';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { PermissionLevels } from '@lib/types/Enums';
import { BrandingColors, Moderation } from '@utils/constants';
import { getColor } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage, KlasaUser, util } from 'klasa';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: language => language.tget('COMMAND_MODERATIONS_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_MODERATIONS_EXTENDED'),
			permissionLevel: PermissionLevels.Moderator,
			requiredPermissions: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
			runIn: ['text'],
			usage: '<mutes|warnings|all:default> [user:username]'
		});
	}

	public async run(message: KlasaMessage, [action, target]: ['mutes' | 'warnings' | 'all', KlasaUser?]) {
		const response = await message.sendEmbed(new MessageEmbed()
			.setDescription(message.language.tget('SYSTEM_LOADING'))
			.setColor(BrandingColors.Secondary));

		const entries = (await (target ? message.guild!.moderation.fetch(target.id) : message.guild!.moderation.fetch()))
			.filter(this.getFilter(action, target));
		if (!entries.size) throw message.language.tget('COMMAND_MODERATIONS_EMPTY');

		const display = new UserRichDisplay(new MessageEmbed()
			.setColor(getColor(message))
			.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setTitle(message.language.tget('COMMAND_MODERATIONS_AMOUNT', entries.size)));

		// Fetch usernames
		const usernames = await (target ? this.fetchAllModerators(entries) : this.fetchAllUsers(entries));

		// Set up the formatter
		const durationDisplay = message.language.duration.bind(message.language);
		const displayName = action === 'all';
		const format = target
			? this.displayModerationLogFromModerators.bind(this, usernames, durationDisplay, displayName)
			: this.displayModerationLogFromUsers.bind(this, usernames, durationDisplay, displayName);

		for (const page of util.chunk([...entries.values()], 10)) {
			display.addPage((template: MessageEmbed) => template.setDescription(page.map(format)));
		}

		await display.start(response, message.author.id);
		return response;
	}

	private displayModerationLogFromModerators(users: Map<string, string>, duration: DurationDisplay, displayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const formattedModerator = users.get(entry.flattenedModerator);
		const formattedReason = entry.reason || 'None';
		const formattedDuration = remainingTime === null ? '' : `\nExpires in: ${duration(remainingTime)}`;
		const formattedTitle = displayName ? `**${entry.title}**\n` : '';
		return `${formattedTitle}Case \`${entry.case}\`. Moderator: **${formattedModerator}**.\n${formattedReason}${formattedDuration}`;
	}

	private displayModerationLogFromUsers(users: Map<string, string>, duration: DurationDisplay, displayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const formattedUser = users.get(entry.flattenedUser);
		const formattedReason = entry.reason || 'None';
		const formattedDuration = remainingTime === null ? '' : `\nExpires in: ${duration(remainingTime)}`;
		const formattedTitle = displayName ? `**${entry.title}**\n` : '';
		return `${formattedTitle}Case \`${entry.case}\`. User: **${formattedUser}**.\n${formattedReason}${formattedDuration}`;
	}

	private async fetchAllUsers(entries: Collection<number, ModerationManagerEntry>) {
		const users = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedUser;
			if (!users.has(id)) users.set(id, await this.client.userTags.fetchUsername(id));
		}
		return users;
	}

	private async fetchAllModerators(entries: Collection<number, ModerationManagerEntry>) {
		const moderators = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedModerator;
			if (!moderators.has(id)) moderators.set(id, await this.client.userTags.fetchUsername(id));
		}
		return moderators;
	}

	private getFilter(type: 'mutes' | 'warnings' | 'all', target: KlasaUser | undefined) {
		switch (type) {
			case 'mutes':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType;
			case 'warnings':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType;
			default:
				return target
					? (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType;
		}
	}

}

type DurationDisplay = (time: number) => string;
