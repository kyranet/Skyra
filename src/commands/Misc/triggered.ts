import { Image } from 'canvas';
import { Canvas } from 'canvas-constructor';
import { readFile } from 'fs-nextra';
import GIFEncoder from 'gifencoder';
import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { join } from 'path';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { fetchAvatar, streamToBuffer } from '../../lib/util/util';
import { assetsFolder } from '../../Skyra';

export default class extends SkyraCommand {

	private template: Buffer = null;

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 30,
			description: (language) => language.get('COMMAND_TRIGGERED_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_TRIGGERED_EXTENDED'),
			requiredPermissions: ['ATTACH_FILES'],
			runIn: ['text'],
			spam: true,
			usage: '[user:username]'
		});
	}

	public async run(message: KlasaMessage, [user = message.author]: [KlasaUser]) {
		const attachment = await this.generate(user);
		return message.channel.send({ files: [{ attachment, name: 'triggered.gif' }] });
	}

	public async generate(user: KlasaUser) {
		const encoder = new GIFEncoder(350, 393);
		const canvas = new Canvas(350, 393);

		const buffers = [this.template, await fetchAvatar(user, 512)];
		const [imgTitle, imgTriggered] = await Promise.all(buffers.map((buffer) => new Promise<Image>((resolve, reject) => {
			const image = new Image(128, 128);
			image.src = buffer;
			image.onload = resolve;
			image.onerror = reject;
			resolve(image);
		})));

		const stream = encoder.createReadStream();
		encoder.start();
		encoder.setRepeat(0);
		encoder.setDelay(50);
		encoder.setQuality(200);

		const coord1 = [-25, -50, -42, -14];
		const coord2 = [-25, -13, -34, -10];

		for (let i = 0; i < 4; i++) {
			encoder.addFrame(canvas
				.addImage(imgTriggered, coord1[i], coord2[i], 400, 400)
				.addImage(imgTitle, 0, 340, 350, 53)
				.setColor('rgba(255 , 100, 0, 0.4)')
				.addRect(0, 0, 350, 350)
				.context);
		}

		encoder.finish();

		return streamToBuffer(stream);
	}

	public async init() {
		this.template = await readFile(join(assetsFolder, './images/memes/triggered.png'));
	}

}
