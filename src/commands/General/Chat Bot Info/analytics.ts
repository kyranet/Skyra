import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { ENABLE_INFLUX } from '#root/config';
import { Mime } from '#utils/constants';
import { fetch, FetchResultTypes } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { Time } from '@sapphire/time-utilities';
import { Message, MessageAttachment } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['growth'],
	cooldown: 10,
	description: LanguageKeys.Commands.General.GrowthDescription,
	extendedHelp: LanguageKeys.Commands.General.GrowthExtended,
	permissions: ['ATTACH_FILES'],
	enabled: ENABLE_INFLUX
})
export default class extends SkyraCommand {
	private cachedGrowth: CachedImage = { nextRefresh: Date.now(), attachment: null };
	private pendingPromise: Promise<Buffer> | null = null;

	public async run(message: Message) {
		if (this.cachedGrowth.attachment && this.cachedGrowth.nextRefresh >= Date.now()) {
			return message.send(this.cachedGrowth.attachment);
		}

		const image = await (this.pendingPromise ??= this.getOutfluxImage().finally(() => {
			this.pendingPromise = null;
		}));
		this.cachedGrowth.nextRefresh = Date.now() + Time.Hour * 12;
		this.cachedGrowth.attachment = new MessageAttachment(image, 'growth.png');

		return message.send(this.cachedGrowth.attachment);
	}

	private async getOutfluxImage() {
		try {
			return await fetch(
				'http://localhost:8286',
				{
					headers: {
						'Content-Type': Mime.Types.ImagePng
					}
				},
				FetchResultTypes.Buffer
			);
		} catch {
			throw this.error(LanguageKeys.Commands.General.GrowthOutfluxError);
		}
	}
}

interface CachedImage {
	nextRefresh: number;
	attachment: MessageAttachment | null;
}
