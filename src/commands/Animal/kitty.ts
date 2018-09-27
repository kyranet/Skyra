const { Command, MessageEmbed } = require('../../index');

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['kitten', 'cat'],
			requiredPermissions: ['EMBED_LINKS'],
			cooldown: 10,
			description: (language) => language.get('COMMAND_KITTY_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_KITTY_EXTENDED')
		});

		this.rand = [
			'77227', '60575', '202462', '164687', '344049', '112786', '103656',
			'384799', '207142', '73164', '42265', '60578', '94171', '78621',
			'138232', '60533', '73165', '54706', '32208', '25687', '20627',
			'64954', '136661', '340024', '447939', '457236', '426098', '180398',
			'313993', '230590', '100241', '54708', '306710', '32510', '344001'
		];

		this.spam = true;
		this.index = Math.ceil(Math.random() * this.rand.length);
	}

	public async run(msg: SkyraMessage) {
		if (this.index > this.rand.length - 1) this.index = 0;
		else this.index += 1;

		return msg.sendEmbed(new MessageEmbed()
			.setImage(`https://wallpapers.wallhaven.cc/wallpapers/full/wallhaven-${this.rand[this.index]}.jpg`));
	}

}
