import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { ContentExtraData, handleMessage } from '@utils/ExceededLengthParser';
import { escapeCodeBlock } from '@utils/External/escapeMarkdown';
import { getContent } from '@utils/util';
import { TextChannel } from 'discord.js';
import { KlasaMessage, Serializer } from 'klasa';

const SNOWFLAKE_REGEXP = Serializer.regex.snowflake;

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['source', 'msg-source', 'message-source'],
	cooldown: 15,
	description: language => language.tget('COMMAND_CONTENT_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_CONTENT_EXTENDED'),
	runIn: ['text'],
	usage: '[channel:channelname] (message:message)',
	usageDelim: ' ',
	flagSupport: true
})
export default class extends SkyraCommand {

	public async init() {
		this.createCustomResolver('message', async (arg, _, message, [channel = message.channel as TextChannel]: TextChannel[]) => {
			if (!arg || !SNOWFLAKE_REGEXP.test(arg)) throw message.language.tget('RESOLVER_INVALID_MESSAGE', 'Message');
			const target = await channel.messages.fetch(arg).catch(() => null);
			if (target) return target;
			throw message.language.tget('SYSTEM_MESSAGE_NOT_FOUND');
		});
	}

	public async run(message: KlasaMessage, [, target]: [TextChannel, KlasaMessage]) {
		const attachments = target.attachments.size
			? target.attachments.map(att => `📁 <${att.url}>`).join('\n')
			: '';
		const content = escapeCodeBlock(getContent(target) || '');

		const sendAs = (
			Reflect.get(message.flagArgs, 'output')
			|| Reflect.get(message.flagArgs, 'output-to')
			|| Reflect.get(message.flagArgs, 'log')
		)
			?? null;

		return handleMessage<Partial<ContentExtraData>>(message, {
			sendAs,
			attachments,
			content,
			targetId: target.id,
			hastebinUnavailable: false,
			url: null,
			canLogToConsole: false
		});
	}

}
