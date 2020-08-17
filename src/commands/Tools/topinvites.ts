import { DbSet } from '@lib/structures/DbSet';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Emojis } from '@utils/constants';
import { Invite, MessageEmbed } from 'discord.js';
import { KlasaMessage, Timestamp } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['topinvs'],
	cooldown: 10,
	description: (language) => language.get('COMMAND_TOPINVITES_DESCRIPTION'),
	extendedHelp: (language) => language.get('COMMAND_TOPINVITES_EXTENDED'),
	requiredGuildPermissions: ['MANAGE_GUILD'],
	runIn: ['text']
})
export default class extends RichDisplayCommand {
	private inviteTimestamp = new Timestamp('YYYY/MM/DD HH:mm');

	public async run(message: KlasaMessage) {
		const response = await message.sendEmbed(
			new MessageEmbed().setDescription(message.language.get('SYSTEM_LOADING')).setColor(BrandingColors.Secondary)
		);

		const invites = await message.guild!.fetchInvites();
		const topTen = invites
			.filter((invite) => invite.uses! > 0 && invite.inviter !== null)
			.sort((a, b) => b.uses! - a.uses!)
			.first(10) as NonNullableInvite[];

		if (topTen.length === 0) throw message.language.get('COMMAND_TOPINVITES_NO_INVITES');

		const display = await this.buildDisplay(message, topTen);

		await display.start(response, message.author.id);
		return response;
	}

	private async buildDisplay(message: KlasaMessage, invites: NonNullableInvite[]) {
		const display = new UserRichDisplay(
			new MessageEmbed()
				.setTitle(message.language.get('COMMAND_TOPINVITES_TOP_10_INVITES_FOR', { guild: message.guild! }))
				.setColor(await DbSet.fetchColor(message))
		);
		const embedData = message.language.get('COMMAND_TOPINVITES_EMBED_DATA');

		for (const invite of invites) {
			display.addPage((embed: MessageEmbed) =>
				embed
					.setAuthor(invite.inviter.tag, invite.inviter.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
					.setThumbnail(invite.inviter.displayAvatarURL({ size: 256, format: 'png', dynamic: true }))
					.setDescription(
						[
							`**${embedData.USES}**: ${this.resolveUses(invite.uses, invite.maxUses)}`,
							`**${embedData.LINK}**: [${invite.code}](${invite.url})`,
							`**${embedData.CHANNEL}**: ${invite.channel}`,
							`**${embedData.TEMPORARY}**: ${invite.temporary ? Emojis.GreenTick : Emojis.RedCross}`
						].join('\n')
					)
					.addField(embedData.CREATED_AT, this.resolveCreationDate(invite.createdTimestamp, embedData.CREATED_AT_UNKNOWN), true)
					.addField(embedData.EXPIRES_IN, this.resolveExpiryDate(message, invite.expiresTimestamp, embedData.NEVER_EXPIRES), true)
			);
		}

		return display;
	}

	private resolveUses(uses: Invite['uses'], maxUses: Invite['maxUses']) {
		if (maxUses !== null && maxUses > 0) return `${uses}/${maxUses}`;
		return uses;
	}

	private resolveExpiryDate(message: KlasaMessage, expiresTimestamp: Invite['expiresTimestamp'], fallback: string) {
		if (expiresTimestamp !== null && expiresTimestamp > 0) return message.language.duration(expiresTimestamp - Date.now(), 2);
		return fallback;
	}

	private resolveCreationDate(createdTimestamp: Invite['createdTimestamp'], fallback: string) {
		if (createdTimestamp !== null) return this.inviteTimestamp.display(createdTimestamp);
		return fallback;
	}
}

type NonNullableInvite = {
	[P in keyof Invite]: NonNullable<Invite[P]>;
};
