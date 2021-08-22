import type { ModerationEntity } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand, SkyraPaginatedMessage } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import { getModeration } from '#utils/functions';
import { TypeVariation } from '#utils/moderationConstants';
import { sendLoadingMessage } from '#utils/util';
import type Collection from '@discordjs/collection';
import { ApplyOptions, RequiresClientPermissions } from '@sapphire/decorators';
import { chunk, cutText } from '@sapphire/utilities';
import { send } from '@skyra/editable-commands';
import { MessageEmbed } from 'discord.js';

const COLORS = [0x80f31f, 0xa5de0b, 0xc7c101, 0xe39e03, 0xf6780f, 0xfe5326, 0xfb3244];
type DurationDisplay = (time: number) => string;

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['hd', 'ho'],
	description: LanguageKeys.Commands.Moderation.HistoryDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.HistoryExtended,
	permissionLevel: PermissionLevels.Moderator,
	runIn: ['GUILD_ANY'],
	subCommands: ['details', { input: 'overview', default: true }]
})
export class UserCommand extends SkyraCommand {
	public run(message: GuildMessage, args: SkyraCommand.Args, context: SkyraCommand.Context) {
		if (context.commandName === 'hd') return this.details(message, args);
		if (context.commandName === 'ho') return this.overview(message, args);
		return super.run(message, args, context);
	}

	public async overview(message: GuildMessage, args: SkyraCommand.Args) {
		const target = args.finished ? message.author : await args.pick('userName');
		const logs = await getModeration(message.guild).fetch(target.id);
		let warnings = 0;
		let mutes = 0;
		let kicks = 0;
		let bans = 0;

		for (const log of logs.values()) {
			if (log.invalidated || log.appealType) continue;
			switch (log.typeVariation) {
				case TypeVariation.Ban:
				case TypeVariation.SoftBan:
					++bans;
					break;
				case TypeVariation.Mute:
					++mutes;
					break;
				case TypeVariation.Kick:
					++kicks;
					break;
				case TypeVariation.Warning:
					++warnings;
			}
		}

		const index = Math.min(COLORS.length - 1, warnings + mutes + kicks + bans);
		const footer = args.t(LanguageKeys.Commands.Moderation.HistoryFooterNew, {
			warnings,
			mutes,
			kicks,
			bans,
			warningsText: args.t(LanguageKeys.Commands.Moderation.HistoryFooterWarning, { count: warnings }),
			mutesText: args.t(LanguageKeys.Commands.Moderation.HistoryFooterMutes, { count: mutes }),
			kicksText: args.t(LanguageKeys.Commands.Moderation.HistoryFooterKicks, { count: kicks }),
			bansText: args.t(LanguageKeys.Commands.Moderation.HistoryFooterBans, { count: bans })
		});

		const embed = new MessageEmbed()
			.setColor(COLORS[index])
			.setAuthor(target.username, target.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setFooter(footer);
		return send(message, { embeds: [embed] });
	}

	@RequiresClientPermissions(['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
	public async details(message: GuildMessage, args: SkyraCommand.Args) {
		const target = args.finished ? message.author : await args.pick('userName');
		const response = await sendLoadingMessage(message, args.t);

		const entries = (await getModeration(message.guild).fetch(target.id)).filter((log) => !log.invalidated && !log.appealType);
		if (!entries.size) this.error(LanguageKeys.Commands.Moderation.ModerationsEmpty);

		const user = this.container.client.user!;
		const display = new SkyraPaginatedMessage({
			template: new MessageEmbed()
				.setColor(await this.container.db.fetchColor(message))
				.setAuthor(user.username, user.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
				.setTitle(args.t(LanguageKeys.Commands.Moderation.ModerationsAmount, { count: entries.size }))
		});

		// Fetch usernames
		const usernames = await this.fetchAllModerators(entries);

		// Set up the formatter
		const durationDisplay = (value: number) => args.t(LanguageKeys.Globals.DurationValue, { value });

		for (const page of chunk([...entries.values()], 10)) {
			display.addPageEmbed((embed) => {
				for (const entry of page) {
					const { name, value } = this.displayModerationLogFromModerators(usernames, durationDisplay, entry);
					embed.addField(name, value);
				}

				return embed;
			});
		}

		await display.run(response, message.author);
		return response;
	}

	private displayModerationLogFromModerators(users: Map<string, string>, duration: DurationDisplay, entry: ModerationEntity) {
		const appealOrInvalidated = entry.appealType || entry.invalidated;
		const remainingTime =
			appealOrInvalidated || entry.duration === null || entry.createdAt === null ? null : entry.createdTimestamp + entry.duration! - Date.now();
		const expiredTime = remainingTime !== null && remainingTime <= 0;
		const formattedModerator = users.get(entry.moderatorId!);
		const formattedReason = entry.reason ? cutText(entry.reason, 800) : 'None';
		const formattedDuration = remainingTime === null || expiredTime ? '' : `\nExpires in: ${duration(remainingTime)}`;
		const formatter = expiredTime || appealOrInvalidated ? '~~' : '';

		return {
			name: `\`${entry.caseId}\` | ${entry.title}`,
			value: `${formatter}Moderator: **${formattedModerator}**.\n${formattedReason}${formattedDuration}${formatter}`
		};
	}

	private async fetchAllModerators(entries: Collection<number, ModerationEntity>) {
		const moderators = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.moderatorId!;
			if (!moderators.has(id)) moderators.set(id, (await entry.fetchModerator()).username);
		}
		return moderators;
	}
}
