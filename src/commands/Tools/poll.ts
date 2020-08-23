import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['spoll'],
	cooldown: 5,
	description: (language) => language.get('commandPollDescription'),
	extendedHelp: (language) => language.get('commandPollExtended'),
	requiredPermissions: ['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'],
	usage: '<title:string>'
})
export default class extends SkyraCommand {
	public async run(message: KlasaMessage) {
		for (const reaction of ['👍', '👎', '🤷']) {
			if (!message.reactions.has(reaction)) await message.react(reaction);
		}

		return message;
	}
}
