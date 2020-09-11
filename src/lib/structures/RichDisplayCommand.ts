import { PermissionResolvable } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand, SkyraCommandOptions } from './SkyraCommand';

export abstract class RichDisplayCommand extends SkyraCommand {
	public constructor(store: CommandStore, file: string[], directory: string, options: SkyraCommandOptions = {}) {
		super(store, file, directory, {
			// Merge in all given options
			...options,
			runIn: ['text'],
			// Add all requiredPermissions set in the command, along with the permissions required for UserRichDisplay
			requiredPermissions: [
				...((options.requiredPermissions as PermissionResolvable[] | undefined) ?? []),
				'ADD_REACTIONS',
				'MANAGE_MESSAGES',
				'EMBED_LINKS',
				'READ_MESSAGE_HISTORY'
			]
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public run(message: KlasaMessage, _params: any[]): any {
		return message;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public inhibit(_message: KlasaMessage): Promise<boolean> | boolean {
		return false;
	}
}

export type RichDisplayCommandOptions = SkyraCommandOptions;
