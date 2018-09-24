const { Command, MessageEmbed } = require('../../index');

module.exports = class extends Command {

	constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			aliases: ['doggo', 'puppy'],
			requiredPermissions: ['EMBED_LINKS'],
			cooldown: 10,
			description: (language) => language.get('COMMAND_DOG_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_DOG_EXTENDED')
		});

		this.rand = [
			'55991', '56020', '236567', '215795', '198588', '239388', '55709',
			'304011', '239386', '137479', '95278', '393154', '61910', '264155',
			'239389', '239395', '293551', '22761', '265279', '137000', '293552',
			'449188', '140491', '203497', '112888', '3058440', '371698', '277752',
			'179920', '96127', '261963', '106499'
		];

		this.spam = true;
		this.index = Math.ceil(Math.random() * this.rand.length);
	}

	async run(msg) {
		if (this.index >= this.rand.length - 1) this.index = 0;
		else this.index++;

		return msg.sendEmbed(new MessageEmbed()
			.setColor(msg.color)
			.setImage(`https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-${this.rand[this.index]}.jpg`));
	}

};
