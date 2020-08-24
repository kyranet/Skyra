import { join } from 'path';

import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { CLIENT_ID } from '@root/config';
import { ApplyOptions } from '@skyra/decorators';
import { assetsFolder } from '@utils/constants';
import { fetchAvatar, radians } from '@utils/util';
import { Image, loadImage } from 'canvas';
import { Canvas } from 'canvas-constructor';
import { User } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	bucket: 2,
	cooldown: 30,
	description: (language) => language.get('commandSlapDescription'),
	extendedHelp: (language) => language.get('commandSlapExtended'),
	requiredPermissions: ['ATTACH_FILES'],
	runIn: ['text'],
	spam: true,
	usage: '<user:username>'
})
export default class extends SkyraCommand {
	private kTemplate: Image = null!;
	private readonly skyraID = CLIENT_ID;

	public async run(message: KlasaMessage, [user]: [User]) {
		const attachment = await this.generate(message, user);
		return message.channel.send({ files: [{ attachment, name: 'slap.png' }] });
	}

	public async generate(message: KlasaMessage, user: User) {
		let selectedUser: User | undefined = undefined;
		let slapper: User | undefined = undefined;
		if (user.id === message.author.id && this.client.options.owners.includes(message.author.id)) throw '💥';
		if (user === message.author) [selectedUser, slapper] = [message.author, this.client.user!];
		else if (this.client.options.owners.concat(this.skyraID).includes(user.id)) [selectedUser, slapper] = [message.author, user];
		else [selectedUser, slapper] = [user, message.author];

		const [robin, batman] = await Promise.all([fetchAvatar(selectedUser, 256), fetchAvatar(slapper, 256)]);

		/* Initialize Canvas */
		return (
			new Canvas(950, 475)
				.printImage(this.kTemplate, 0, 0, 950, 475)

				// Draw Batman
				.save()
				.setTransform(-1, 0, 0, 1, 476, 173)
				.rotate(radians(-13.96))
				.printCircularImage(batman, 0, 0, 79)
				.restore()

				// Draw Robin
				.translate(244, 265)
				.rotate(radians(-24.53))
				.printCircularImage(robin, 0, 0, 93)

				// Draw the buffer
				.toBufferAsync()
		);
	}

	public async init() {
		this.kTemplate = await loadImage(join(assetsFolder, './images/memes/slap.png'));
	}
}
