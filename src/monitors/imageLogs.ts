import { MessageEmbed, TextChannel, MessageAttachment } from 'discord.js';
import { KlasaMessage, Monitor, util } from 'klasa';
import { Events } from '../lib/types/Enums';
import { GuildSettings } from '../lib/types/settings/GuildSettings';
import { MessageLogsEnum } from '../lib/util/constants';
import { fetch, FetchResultTypes, IMAGE_EXTENSION } from '../lib/util/util';
import { extname } from 'path';

const MAXIMUM_SIZE = 300;
// 1024 = 1 kilobyte
// 1024 * 1024 = 1 megabyte
const MAXIMUM_LENGTH = 1024 * 1024;

export default class extends Monitor {

	public async run(message: KlasaMessage) {
		for (const image of this.getAttachments(message)) {
			const dimensions = this.getDimensions(image.width, image.height);
			if (!dimensions.height || !dimensions.width) return;
			const url = new URL(image.proxyURL);
			url.searchParams.append('width', dimensions.width.toString());
			url.searchParams.append('height', dimensions.height.toString());

			const result = await fetch(url, FetchResultTypes.Result).catch(error => {
				throw new Error(`ImageLogs[${error}] ${url}`);
			});
			const contentLength = result.headers.get('content-length');
			if (contentLength === null) return;

			const parsedContentLength = parseInt(contentLength, 10);
			if (!util.isNumber(parsedContentLength)) return;
			if (parsedContentLength > MAXIMUM_LENGTH) return;

			const buffer = await result.buffer();
			const filename = `image${extname(url.pathname)}`;

			this.client.emit(Events.GuildMessageLog, MessageLogsEnum.Image, message.guild, () => new MessageEmbed()
				.setColor(0xEFAE45)
				.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ size: 128 }))
				.setDescription(`[${message.language.tget('JUMPTO')}](${message.url})`)
				.setFooter(`#${(message.channel as TextChannel).name}`)
				.attachFiles([new MessageAttachment(buffer, filename)])
				.setImage(`attachment://${filename}`)
				.setTimestamp());
		}
	}

	public shouldRun(message: KlasaMessage) {
		return this.enabled
			&& message.attachments.size !== 0
			&& message.guild !== null
			&& message.author !== null
			&& message.webhookID === null
			&& !message.system
			&& message.author.id !== this.client.user!.id
			&& message.guild.settings.get(GuildSettings.Channels.ImageLogs) !== null
			&& !message.guild.settings.get(GuildSettings.Selfmod.IgnoreChannels).includes(message.channel.id);
	}

	private *getAttachments(message: KlasaMessage) {
		for (const attachment of message.attachments.values()) {
			if (!IMAGE_EXTENSION.test(attachment.url)) continue;

			yield {
				url: attachment.url,
				proxyURL: attachment.proxyURL,
				height: attachment.height!,
				width: attachment.width!
			};
		}
	}

	private getDimensions(width: number, height: number) {
		if (width > height) {
			// Landscape
			// width -> MAX, height = ORIGINAL_HEIGHT / (ORIGINAL_WIDTH / MAX)
			// width -> MAX, height = ORIGINAL_HEIGHT / PROPORTION
			//
			// For 900x450, given MAX = 300
			// width: 300
			// height: 450 / (900 / 300) -> 450 / 3 -> 150
			// 900x450 -> 300x150 keeps 2:1 proportion
			const scaledHeight = Math.floor(height / (width / MAXIMUM_SIZE));
			return scaledHeight === 0 ? { width, height } : { width: MAXIMUM_SIZE, height: scaledHeight };
		}

		if (width < height) {
			// Portrait
			// width -> ORIGINAL_WIDTH / (ORIGINAL_HEIGHT / MAX), height -> MAX
			// width -> ORIGINAL_WIDTH / PROPORTION, height -> MAX
			//
			// For 450x900, given MAX = 300
			// width: 450 / (900 / 300) -> 450 / 3 -> 150
			// height: 300
			// 450x900 -> 150x300 keeps 1:2 proportion
			const scaledWidth = Math.floor(width / (height / MAXIMUM_SIZE));
			return scaledWidth === 0 ? { width, height } : { width: scaledWidth, height: MAXIMUM_SIZE };
		}

		// Square
		// width -> MAX, height -> MAX
		//
		// For 450x450, given MAX = 300
		// width: 300
		// height: 300
		// 450x450 -> 300x300 keeps 1:1 proportion
		return {
			width: MAXIMUM_SIZE,
			height: MAXIMUM_SIZE
		};
	}

}
