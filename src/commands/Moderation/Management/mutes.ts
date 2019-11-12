import { CommandStore, KlasaMessage, KlasaUser } from 'klasa';
import { SkyraCommand } from '../../../lib/structures/SkyraCommand';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: language => language.tget('COMMAND_MUTES_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_MUTES_EXTENDED'),
			permissionLevel: 5,
			requiredPermissions: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
			runIn: ['text'],
			usage: '[user:username]'
		});
	}

	public run(message: KlasaMessage, [target]: [KlasaUser?]) {
		const moderations = this.store.get('moderations') as unknown as Moderations | undefined;
		if (typeof moderations === 'undefined') throw new Error('Moderations command not loaded yet.');
		return moderations.run(message, ['mutes', target]);
	}

}

interface Moderations extends SkyraCommand {
	run(message: KlasaMessage, args: ['mutes' | 'warnings' | 'all', KlasaUser | undefined]): Promise<KlasaMessage>;
}
