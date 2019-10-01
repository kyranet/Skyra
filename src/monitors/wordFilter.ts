import { MessageEmbed, TextChannel } from 'discord.js';
import { KlasaMessage, Monitor, util } from 'klasa';
import { Events } from '../lib/types/Enums';
import { GuildSettings } from '../lib/types/settings/GuildSettings';
import { MessageLogsEnum } from '../lib/util/constants';
import { cutText, getContent } from '../lib/util/util';
import { remove } from 'confusables';

const ALERT_FLAG = 1 << 2;
const LOG_FLAG = 1 << 1;
const DELETE_FLAG = 1 << 0;

export default class extends Monitor {

	public async run(message: KlasaMessage) {
		const level = message.guild!.settings.get(GuildSettings.Filter.Level) as GuildSettings.Filter.Level;
		if (!level) return;

		const content = getContent(message);
		if (content === null) return;
		if (await message.hasAtLeastPermissionLevel(5)) return;

		const results = this.filter(remove(content), message.guild!.security.regexp!);
		if (results === null) return;

		if ((level & DELETE_FLAG) && message.deletable) {
			if (message.content.length > 25) {
				message.author!.send(message.language.get('MONITOR_WORDFILTER_DM',
					util.codeBlock('md', cutText(results.filtered, 1900)))).catch(() => null);
			}
			message.nuke().catch(() => null);
		}

		if ((level & ALERT_FLAG) && message.channel.postable) {
			message.alert(message.language.get('MONITOR_WORDFILTER', message.author)).catch(() => null);
		}

		if (level & LOG_FLAG) {
			this.client.emit(Events.GuildMessageLog, MessageLogsEnum.Moderation, message.guild, () => new MessageEmbed()
				.splitFields(cutText(results.highlighted, 4000))
				.setColor(0xEFAE45)
				.setAuthor(`${message.author!.tag} (${message.author!.id})`, message.author!.displayAvatarURL({ size: 128 }))
				.setFooter(`#${(message.channel as TextChannel).name} | ${message.language.get('CONST_MONITOR_WORDFILTER')}`)
				.setTimestamp());
		}
	}

	public shouldRun(message: KlasaMessage) {
		return this.enabled
			&& message.guild !== null
			&& message.author !== null
			&& message.webhookID === null
			&& !message.system
			&& message.author.id !== this.client.user!.id
			&& message.guild!.security.regexp !== null
			&& !(message.guild.settings.get(GuildSettings.Selfmod.IgnoreChannels) as GuildSettings.Selfmod.IgnoreChannels).includes(message.channel.id);
	}

	private filter(str: string, regex: RegExp): { filtered: string; highlighted: string } | null {
		const matches = str.match(regex);
		if (matches === null) return null;

		let last = 0;
		let next = 0;

		const filtered: string[] = [];
		const highlighted: string[] = [];
		for (const match of matches) {
			next = str.indexOf(match, last);
			const section = str.slice(last, next);
			if (section) {
				filtered.push(section, '*'.repeat(match.length));
				highlighted.push(section, `__${match}__`);
			} else {
				filtered.push('*'.repeat(match.length));
				highlighted.push(`__${match}__`);
			}
			last = next + match.length;
		}

		if (last !== str.length) {
			const end = str.slice(last);
			filtered.push(end);
			highlighted.push(end);
		}

		return {
			filtered: filtered.join(''),
			highlighted: highlighted.join('')
		};
	}

}
