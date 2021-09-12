import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { Events, PermissionLevels } from '#lib/types/Enums';
import { getModeration, sendTemporaryMessage } from '#utils/functions';
import { getImage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord-api-types/payloads/v9';

@ApplyOptions<SkyraCommand.Options>({
	description: LanguageKeys.Commands.Moderation.ReasonDescription,
	extendedHelp: LanguageKeys.Commands.Moderation.ReasonExtended,
	permissionLevel: PermissionLevels.Moderator,
	requiredClientPermissions: [PermissionFlagsBits.EmbedLinks],
	runIn: [CommandOptionsRunTypeEnum.GuildAny]
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		const cases = await args
			.pick('case')
			.then((value) => [value])
			.catch(() => args.pick('range', { maximum: 50 }));

		const moderation = getModeration(message.guild);
		const entries = await moderation.fetch(cases);
		if (!entries.size) {
			this.error(LanguageKeys.Commands.Moderation.ModerationCaseNotExists, { count: cases.length });
		}

		const reason = await args.rest('string');
		const imageURL = getImage(message);
		const { moderations } = this.container.db;
		await moderations
			.createQueryBuilder()
			.update()
			.where('guild_id = :guild', { guild: message.guild.id })
			.andWhere('case_id IN (:...ids)', { ids: [...entries.keys()] })
			.set({ reason, imageURL })
			.execute();
		await moderation.fetchChannelMessages();
		for (const entry of entries.values()) {
			const clone = entry.clone();
			entry.setReason(reason).setImageURL(imageURL);
			this.container.client.emit(Events.ModerationEntryEdit, clone, entry);
		}

		return sendTemporaryMessage(
			message,
			args.t(LanguageKeys.Commands.Moderation.ReasonUpdated, {
				entries: cases,
				newReason: reason,
				count: cases.length
			})
		);
	}
}
