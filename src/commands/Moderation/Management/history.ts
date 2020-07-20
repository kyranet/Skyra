import { Cache } from '@klasa/cache';
import { chunk } from '@klasa/utils';
import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { PermissionLevels } from '@lib/types/Enums';
import { ModerationEntity } from '@orm/entities/ModerationEntity';
import { ApplyOptions, requiredPermissions } from '@skyra/decorators';
import { BrandingColors, Moderation } from '@utils/constants';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, KlasaUser } from 'klasa';
import { cutText } from '@utils/util';

const COLORS = [0x80F31F, 0xA5DE0B, 0xC7C101, 0xE39E03, 0xF6780F, 0xFE5326, 0xFB3244];

@ApplyOptions<SkyraCommandOptions>({
	bucket: 2,
	cooldown: 10,
	description: language => language.tget('COMMAND_HISTORY_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_HISTORY_EXTENDED'),
	permissionLevel: PermissionLevels.Moderator,
	runIn: ['text'],
	usage: '<details|overview:default> [user:username]',
	usageDelim: ' ',
	subcommands: true
})
export default class extends SkyraCommand {

	public async overview(message: KlasaMessage, [target = message.author]: [KlasaUser]) {
		const logs = await message.guild!.moderation.fetch(target.id);
		let warnings = 0;
		let mutes = 0;
		let kicks = 0;
		let bans = 0;
		for (const log of logs.values()) {
			if (log.invalidated) continue;
			switch (log.typeVariation) {
				case Moderation.TypeVariation.Ban:
				case Moderation.TypeVariation.Softban: bans++;
					break;
				case Moderation.TypeVariation.Mute: mutes++;
					break;
				case Moderation.TypeVariation.Kick: kicks++;
					break;
				case Moderation.TypeVariation.Warning: warnings++;
			}
		}

		const index = Math.min(COLORS.length - 1, warnings + mutes + kicks + bans);

		return message.sendEmbed(new MessageEmbed()
			.setColor(COLORS[index])
			.setAuthor(target.username, target.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setFooter(message.language.tget('COMMAND_HISTORY_FOOTER', warnings, mutes, kicks, bans)));
	}

	@requiredPermissions(['ADD_REACTIONS', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY'])
	public async details(message: KlasaMessage, [target = message.author]: [KlasaUser]) {
		const response = await message.sendEmbed(new MessageEmbed()
			.setDescription(message.language.tget('SYSTEM_LOADING'))
			.setColor(BrandingColors.Secondary));

		const entries = (await message.guild!.moderation.fetch(target.id)).filter(log => !log.invalidated);
		if (!entries.size) throw message.language.tget('COMMAND_MODERATIONS_EMPTY');

		const display = new UserRichDisplay(new MessageEmbed()
			.setColor(await DbSet.fetchColor(message))
			.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setTitle(message.language.tget('COMMAND_MODERATIONS_AMOUNT', entries.size)));

		// Fetch usernames
		const usernames = await this.fetchAllModerators(entries);

		// Set up the formatter
		const durationDisplay = message.language.duration.bind(message.language);
		const format = this.displayModerationLogFromModerators.bind(this, usernames, durationDisplay);

		for (const page of chunk([...entries.values()], 10)) {
			display.addPage((template: MessageEmbed) => template.setDescription(cutText(page.map(format).join('\n'), 2000)));
		}

		await display.start(response, message.author.id);
		return response;
	}

	private displayModerationLogFromModerators(users: Map<string, string>, duration: DurationDisplay, entry: ModerationEntity) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdTimestamp + entry.duration!) - Date.now();
		const formattedModerator = users.get(entry.moderatorID!);
		const formattedReason = entry.reason || 'None';
		const formattedTitle = `**${entry.title}**\n`;
		const formattedDuration = entry.appealType
			? ''
			: remainingTime === null
				? ''
				: `\nExpires in: ${duration(remainingTime)}`;
		return `${formattedTitle}Case \`${entry.caseID}\`. Moderator: **${formattedModerator}**.\n${formattedReason}${formattedDuration}`;
	}

	private async fetchAllModerators(entries: Cache<number, ModerationEntity>) {
		const moderators = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.moderatorID!;
			if (!moderators.has(id)) moderators.set(id, (await entry.fetchModerator()).username);
		}
		return moderators;
	}

}

type DurationDisplay = (time: number) => string;
