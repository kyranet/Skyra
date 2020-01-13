import { HardPunishment, ModerationMonitor } from '@lib/structures/ModerationMonitor';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { UserSettings } from '@lib/types/settings/UserSettings';
import { cutText, floatPromise } from '@utils/util';
import { MessageEmbed, TextChannel } from 'discord.js';
import { KlasaMessage, util } from 'klasa';
import { Colors } from '@lib/types/constants/Constants';

const OFFSET = 0b100000;
/**
 * In ASCII, the 6th bit tells whether a character is lowercase or uppercase:
 *
 * 'a': 97 (1100001)
 * 'A': 65 (1000001)
 *
 * So the most efficient way to check if a character is uppercase is by checking
 * it. In this version, we use the AND bitwise operator to change the value of the
 * 6th bit to 1 and then checking if it is equal to the original number.
 *
 * To sum up: Doing the operation `code & 223` converts any ASCII character from
 * lower case to upper case (upper case characters are unaffected).
 */

export default class extends ModerationMonitor {

	protected readonly keyEnabled = GuildSettings.Selfmod.Capitals.Enabled;
	protected readonly ignoredChannelsPath = GuildSettings.Selfmod.Capitals.IgnoredChannels;
	protected readonly ignoredRolesPath = GuildSettings.Selfmod.Capitals.IgnoredRoles;
	protected readonly softPunishmentPath = GuildSettings.Selfmod.Capitals.SoftAction;
	protected readonly hardPunishmentPath: HardPunishment = {
		action: GuildSettings.Selfmod.Capitals.HardAction,
		actionDuration: GuildSettings.Selfmod.Capitals.HardActionDuration,
		adder: 'capitals',
		adderMaximum: GuildSettings.Selfmod.Capitals.ThresholdMaximum,
		adderDuration: GuildSettings.Selfmod.Capitals.ThresholdDuration
	};

	public shouldRun(message: KlasaMessage) {
		return super.shouldRun(message)
			&& message.content.length > 0
			&& message.guild!.settings.get(GuildSettings.Selfmod.Capitals.Minimum) < message.content.length;
	}

	protected preProcess(message: KlasaMessage) {
		const capsthreshold = message.guild!.settings.get(GuildSettings.Selfmod.Capitals.Maximum);
		const { length } = message.content;
		let count = 0;
		let i = 0;

		while (i < length) if ((message.content.charCodeAt(i++) & OFFSET) === 0) count++;

		return (count / length) * 100 > capsthreshold ? count : null;
	}

	protected async onDelete(message: KlasaMessage, value: number) {
		floatPromise(this, message.nuke());
		if (value > 25 && (await message.author.settings.sync()).get(UserSettings.ModerationDM)) {
			floatPromise(this, message.author.sendLocale('MONITOR_CAPSFILTER_DM', [util.codeBlock('md', cutText(message.content, 1900))]));
		}
	}

	protected onAlert(message: KlasaMessage) {
		floatPromise(this, message.alert(message.language.tget('MONITOR_CAPSFILTER', message.author.toString())));
	}

	protected onLogMessage(message: KlasaMessage) {
		return new MessageEmbed()
			.splitFields(message.content)
			.setColor(Colors.Red)
			.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ size: 128 }))
			.setFooter(`#${(message.channel as TextChannel).name} | ${message.language.tget('CONST_MONITOR_CAPSFILTER')}`)
			.setTimestamp();
	}

}
