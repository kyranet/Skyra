import { DbSet } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ApplyOptions } from '@sapphire/decorators';
import { roundNumber } from '@sapphire/utilities';
import { Message, MessageEmbed, version } from 'discord.js';
import { CpuInfo, cpus, uptime } from 'os';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['stats', 'sts'],
	bucket: 2,
	cooldown: 15,
	description: LanguageKeys.Commands.System.StatsDescription,
	extendedHelp: LanguageKeys.Commands.System.StatsExtended,
	permissions: ['EMBED_LINKS']
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		return message.send(await this.buildEmbed(message, args));
	}

	private async buildEmbed(message: Message, args: SkyraCommand.Args) {
		const titles = args.t(LanguageKeys.Commands.System.StatsTitles);
		const fields = args.t(LanguageKeys.Commands.System.StatsFields, {
			stats: this.generalStatistics,
			uptime: this.uptimeStatistics,
			usage: this.usageStatistics
		});
		return new MessageEmbed()
			.setColor(await DbSet.fetchColor(message))
			.addField(titles.stats, fields.stats)
			.addField(titles.uptime, fields.uptime)
			.addField(titles.serverUsage, fields.serverUsage);
	}

	private get generalStatistics(): StatsGeneral {
		const { client } = this.context;
		return {
			channels: client.channels.cache.size,
			guilds: client.guilds.cache.size,
			nodeJs: process.version,
			users: client.guilds.cache.reduce((acc, val) => acc + (val.memberCount ?? 0), 0),
			version: `v${version}`
		};
	}

	private get uptimeStatistics(): StatsUptime {
		return {
			client: this.context.client.uptime!,
			host: uptime() * 1000,
			total: process.uptime() * 1000
		};
	}

	private get usageStatistics(): StatsUsage {
		const usage = process.memoryUsage();
		return {
			cpuLoad: cpus().map(UserCommand.formatCpuInfo.bind(null)).join(' | '),
			ramTotal: usage.heapTotal / 1048576,
			ramUsed: usage.heapUsed / 1048576
		};
	}

	private static formatCpuInfo({ times }: CpuInfo) {
		return `${roundNumber(((times.user + times.nice + times.sys + times.irq) / times.idle) * 10000) / 100}%`;
	}
}

export interface StatsGeneral {
	channels: number;
	guilds: number;
	nodeJs: string;
	users: number;
	version: string;
}

export interface StatsUptime {
	client: number;
	host: number;
	total: number;
}

export interface StatsUsage {
	cpuLoad: string;
	ramTotal: number;
	ramUsed: number;
}
