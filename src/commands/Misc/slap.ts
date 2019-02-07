import { Canvas } from 'canvas-constructor';
import { readFile } from 'fs-nextra';
import { CommandStore, KlasaClient, KlasaMessage, KlasaUser } from 'klasa';
import { join } from 'path';
import { CLIENT_ID } from '../../../config';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { fetchAvatar } from '../../lib/util/util';
import { assetsFolder } from '../../Skyra';

export default class extends SkyraCommand {

	private template: Buffer = null;
	private readonly ownerID = this.client.options.ownerID;
	private readonly skyraID = CLIENT_ID;

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 30,
			description: (language) => language.get('COMMAND_SLAP_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SLAP_EXTENDED'),
			requiredPermissions: ['ATTACH_FILES'],
			runIn: ['text'],
			spam: true,
			usage: '<user:username>'
		});
	}

	public async run(message: KlasaMessage, [user]: [KlasaUser]) {
		const attachment = await this.generate(message, user);
		return message.channel.send({ files: [{ attachment, name: 'slap.png' }] });
	}

	public async generate(message: KlasaMessage, user: KlasaUser) {
		let selectedUser;
		let slapper;
		if (user.id === this.ownerID && message.author.id === this.ownerID) throw '💥';
		if (user === message.author) [selectedUser, slapper] = [message.author, this.client.user];
		else if ([this.ownerID, this.skyraID].includes(user.id)) [selectedUser, slapper] = [message.author, user];
		else [selectedUser, slapper] = [user, message.author];

		const [Slapped, Slapper] = await Promise.all([
			fetchAvatar(selectedUser, 256),
			fetchAvatar(slapper, 256)
		]);

		/* Initialize Canvas */
		return new Canvas(950, 475)
			.addImage(this.template, 0, 0, 950, 475)
			.addImage(Slapper, 410, 107, 131, 131, { type: 'round', radius: 66, restore: true })
			.addImage(Slapped, 159, 180, 169, 169, { type: 'round', radius: 85, restore: true })
			.toBufferAsync();
	}

	public async init() {
		this.template = await readFile(join(assetsFolder, './images/memes/imageSlap.png'));
	}

}
