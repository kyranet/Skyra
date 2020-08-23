import { DbSet } from '@lib/structures/DbSet';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { fetch, FetchResultTypes, isImageURL } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['doggo', 'puppy'],
	cooldown: 10,
	description: (language) => language.get('commandDogDescription'),
	extendedHelp: (language) => language.get('commandDogExtended'),
	requiredPermissions: ['EMBED_LINKS'],
	spam: true
})
export default class extends SkyraCommand {
	public async run(message: KlasaMessage) {
		const [color, image] = await Promise.all([DbSet.fetchColor(message), this.fetchImage()]);

		return message.sendEmbed(new MessageEmbed().setColor(color).setImage(image).setTimestamp());
	}

	private async fetchImage() {
		const randomDogData = await fetch<DogResultOk>('https://dog.ceo/api/breeds/image/random', FetchResultTypes.JSON).catch(() => null);
		return randomDogData?.status === 'success' && isImageURL(randomDogData.message) ? randomDogData.message : 'https://i.imgur.com/cF0XUF5.jpg';
	}
}

export interface DogResultOk {
	message: string;
	status: string;
}
