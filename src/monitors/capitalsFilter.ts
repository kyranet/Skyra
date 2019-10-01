import { MessageEmbed, TextChannel } from 'discord.js';
import { KlasaMessage, util } from 'klasa';
import { GuildSettings } from '../lib/types/settings/GuildSettings';
import { cutText, floatPromise } from '../lib/util/util';
import { ModerationMonitor } from '../lib/structures/ModerationMonitor';
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

	protected softPunishmentPath = GuildSettings.Selfmod.CapsFilter;
	protected hardPunishmentPath = null;

	public shouldRun(message: KlasaMessage) {
		return super.shouldRun(message)
			&& message.content.length > 0
			&& (message.guild!.settings.get(GuildSettings.Selfmod.CapsMinimum) as GuildSettings.Selfmod.CapsMinimum) < message.content.length;
	}

	protected preProcess(message: KlasaMessage) {
		const capsthreshold = message.guild!.settings.get(GuildSettings.Selfmod.Capsthreshold) as GuildSettings.Selfmod.Capsthreshold;
		const { length } = message.content;
		let count = 0;
		let i = 0;

		while (i < length) if ((message.content.charCodeAt(i++) & OFFSET) === 0) count++;

		return (count / length) * 100 > capsthreshold ? count : null;
	}

	protected onDelete(message: KlasaMessage, value: number) {
		if (value > 25) floatPromise(this, message.author!.send(message.language.get('MONITOR_CAPSFILTER_DM', util.codeBlock('md', cutText(message.content, 1900)))));
		floatPromise(this, message.nuke());
	}

	protected onAlert(message: KlasaMessage) {
		floatPromise(this, message.alert(message.language.get('MONITOR_CAPSFILTER', message.author)));
	}

	protected onLogMessage(message: KlasaMessage) {
		return new MessageEmbed()
			.splitFields(message.content)
			.setColor(0xEFAE45)
			.setAuthor(`${message.author!.tag} (${message.author!.id})`, message.author!.displayAvatarURL({ size: 128 }))
			.setFooter(`#${(message.channel as TextChannel).name} | ${message.language.get('CONST_MONITOR_CAPSFILTER')}`)
			.setTimestamp();
	}

}
