import { SkyraCommand } from '@lib/structures/SkyraCommand';
import { PermissionLevels } from '@lib/types/Enums';
import { User } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';

export default class extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('commandWarningsDescription'),
			extendedHelp: (language) => language.get('commandWarningsExtended'),
			permissionLevel: PermissionLevels.Moderator,
			requiredPermissions: ['EMBED_LINKS', 'MANAGE_MESSAGES'],
			runIn: ['text'],
			usage: '[user:username]'
		});
	}

	public run(message: KlasaMessage, [target]: [User?]) {
		const moderations = (this.store.get('moderations') as unknown) as Moderations | undefined;
		if (typeof moderations === 'undefined') throw new Error('Moderations command not loaded yet.');
		return moderations.run(message, ['warnings', target]);
	}
}

interface Moderations extends SkyraCommand {
	run(message: KlasaMessage, args: ['mutes' | 'warnings' | 'all', User | undefined]): Promise<KlasaMessage>;
}
