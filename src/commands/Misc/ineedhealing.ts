const { Command, util: { fetchAvatar }, assetsFolder } = require('../../index');
const { readFile } = require('fs-nextra');
const { join } = require('path');
const { Canvas } = require('canvas-constructor');

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			requiredPermissions: ['ATTACH_FILES'],
			bucket: 2,
			cooldown: 30,
			description: (language) => language.get('COMMAND_INEEDHEALING_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_INEEDHEALING_EXTENDED'),
			runIn: ['text'],
			usage: '<user:username>'
		});

		this.spam = true;
		this.template = null;
	}

	public async run(msg, [user]) {
		const attachment = await this.generate(msg, user);
		return msg.channel.send({ files: [{ attachment, name: 'INeedHealing.png' }] });
	}

	public async generate(msg, user) {
		if (user.id === msg.author.id) ({ user } = this.client);

		const [healer, healed] = await Promise.all([
			fetchAvatar(msg.author, 128),
			fetchAvatar(user, 128)
		]);

		return new Canvas(333, 500)
			.addImage(this.template, 0, 0, 333, 500)
			.addImage(healer, 189, 232, 110, 110, { type: 'round', radius: 55, restore: true })
			.addImage(healed, 70, 96, 106, 106, { type: 'round', radius: 53, restore: true })
			.toBufferAsync();
	}

	public async init() {
		this.template = await readFile(join(assetsFolder, './images/memes/ineedhealing.png'));
	}

}
