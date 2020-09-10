import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { assetsFolder } from '@utils/constants';
import { fetchAvatar, radians } from '@utils/util';
import { Image, loadImage } from 'canvas';
import { Canvas } from 'canvas-constructor';
import { User } from 'discord.js';
import { KlasaMessage } from 'klasa';
import { join } from 'path';

@ApplyOptions<SkyraCommandOptions>({
	cooldown: 15,
	description: (language) => language.get('commandWakandaDescription'),
	extendedHelp: (language) => language.get('commandWakandaExtended'),
	requiredPermissions: ['ATTACH_FILES'],
	usage: '[user:username]'
})
export default class extends SkyraCommand {
	private kTemplate: Image = null!;

	public async run(message: KlasaMessage, [user = message.author]: [User]) {
		const userAvatar = await fetchAvatar(user);
		const image = this.generateImage(userAvatar);

		return message.channel.sendFile(image.toBuffer(), "we-don't-do-that-here.png");
	}

	public async init() {
		this.kTemplate = await loadImage(join(assetsFolder, './images/memes/we-dont-do-that-here.png'));
	}

	private generateImage(avatar: Image) {
		return new Canvas(800, 450)
			.printImage(this.kTemplate, 0, 0)
			.save()
			.translate(316, 115)
			.rotate(radians(10))
			.printCircularImage(avatar, 0, 0, 65);
	}
}
