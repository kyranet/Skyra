import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { getImageUrl } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { fetch, FetchResultTypes } from '@sapphire/fetch';
import { send } from '@skyra/editable-commands';
import { Message, MessageEmbed } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['doggo', 'puppy'],
	description: LanguageKeys.Commands.Animal.DogDescription,
	extendedHelp: LanguageKeys.Commands.Animal.DogExtended,
	requiredClientPermissions: ['EMBED_LINKS'],
	spam: true
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message) {
		const [color, image] = await Promise.all([this.container.db.fetchColor(message), this.fetchImage()]);

		const embed = new MessageEmbed().setColor(color).setImage(image!).setTimestamp();
		return send(message, { embeds: [embed] });
	}

	private async fetchImage() {
		const randomDogData = await fetch<DogResultOk>('https://dog.ceo/api/breeds/image/random', FetchResultTypes.JSON).catch(() => null);
		return randomDogData?.status === 'success' ? getImageUrl(randomDogData.message) : 'https://i.imgur.com/cF0XUF5.jpg';
	}
}

export interface DogResultOk {
	message: string;
	status: string;
}
