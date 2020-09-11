import { DbSet } from '@lib/structures/DbSet';
import { MusicCommandOptions } from '@lib/structures/MusicCommand';
import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { codeBlock } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors } from '@utils/constants';
import { GuildMember, MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

const [kLowestNumberCode, kHighestNumberCode] = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

@ApplyOptions<MusicCommandOptions>({
	aliases: ['dh'],
	cooldown: 5,
	description: (language) => language.get('commandDehoistDescription'),
	extendedHelp: (language) => language.get('commandDehoistExtended'),
	runIn: ['text'],
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['MANAGE_NICKNAMES', 'EMBED_LINKS']
})
export default class extends SkyraCommand {
	private kLowestCode = 'A'.charCodeAt(0);

	public async run(message: KlasaMessage) {
		if (message.guild!.members.cache.size !== message.guild!.memberCount) {
			await message.sendEmbed(new MessageEmbed().setDescription(message.language.get('systemLoading')).setColor(BrandingColors.Secondary));
			await message.guild!.members.fetch();
		}

		let counter = 0;
		const errored: ErroredChange[] = [];
		const hoistedMembers: GuildMember[] = [];
		for (const member of message.guild!.members.cache.values()) {
			if (member.manageable && this.shouldDehoist(member)) hoistedMembers.push(member);
		}

		const response = await message.sendLocale('commandDehoistStarting', [{ count: hoistedMembers.length }]);

		for (let i = 0; i < hoistedMembers.length; i++) {
			const member = hoistedMembers[i];
			const { displayName } = member;

			const char = displayName.codePointAt(0)!;

			// Replace the first character of the offending user's with an UTF-16 character, bringing'em down, down, down.
			// The ternary cuts 2 characters if the 1st codepoint belongs in UTF-16
			const newNick = `🠷${displayName.slice(char <= 0xff ? 1 : 2)}`;
			try {
				await member.setNickname(newNick, 'Dehoisting');
			} catch {
				errored.push({ oldNick: displayName, newNick });
			}

			++counter;

			// update the counter every 10 dehoists
			if ((i + 1) % 10 === 0) {
				const dehoistPercentage = (i / hoistedMembers.length) * 100;
				await message.sendLocale('commandDehoistProgress', [{ count: i + 1, percentage: Math.round(dehoistPercentage) }]);
			}
		}

		// We're done!
		return response.edit({
			embed: await this.prepareFinalEmbed(message, counter, errored),
			content: null
		});
	}

	private shouldDehoist(member: GuildMember) {
		const { displayName } = member;
		if (!displayName) return false;

		const char = displayName.codePointAt(0)!;

		// If it's lower than '0' or is higher than '9' and lower than 'A', then it's hoisting
		return char < this.kLowestCode && (char < kLowestNumberCode || char > kHighestNumberCode);
	}

	private async prepareFinalEmbed(message: KlasaMessage, dehoistedMembers: number, erroredChanges: ErroredChange[]) {
		const embedLanguage = message.language.get('commandDehoistEmbed', {
			dehoistedMemberCount: dehoistedMembers,
			dehoistedWithErrorsCount: dehoistedMembers - erroredChanges.length,
			errored: erroredChanges.length,
			users: message.guild!.members.cache.size
		});
		const embed = new MessageEmbed().setColor(await DbSet.fetchColor(message)).setTitle(embedLanguage.title);

		let { description } = embedLanguage;
		if (dehoistedMembers <= 0) description = embedLanguage.descriptionNoone;
		if (erroredChanges.length > 0) {
			description = embedLanguage.descriptionWitherrors;
			const erroredNicknames = erroredChanges.map((entry) => `${entry.oldNick} => ${entry.newNick}`).join('\n');
			const codeblock = codeBlock('js', erroredNicknames);
			embed.addField(embedLanguage.fieldErrorTitle, codeblock);
		}
		return embed.setDescription(description);
	}
}

interface ErroredChange {
	oldNick: string;
	newNick: string;
}
