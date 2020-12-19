import { SkyraCommand, SkyraCommandOptions } from '#lib/structures/SkyraCommand';
import { PermissionLevels } from '#lib/types/Enums';
import { LanguageKeys } from '#lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';
import { KlasaMessage, Piece } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['u'],
	description: (language) => language.get(LanguageKeys.Commands.System.UnloadDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.System.UnloadExtended),
	guarded: true,
	permissionLevel: PermissionLevels.BotOwner,
	usage: '<Piece:piece>'
})
export default class extends SkyraCommand {
	public async run(message: KlasaMessage, [piece]: [Piece]) {
		if ((piece.type === 'event' && piece.name === 'message') || (piece.type === 'monitor' && piece.name === 'commandHandler')) {
			return message.sendLocale('commandUnloadWarn');
		}
		piece.unload();
		if (this.client.shard) {
			await this.client.shard.broadcastEval(`
				if (String(this.options.shards) !== '${this.client.options.shards}') this.${piece.store}.get('${piece.name}').unload();
			`);
		}
		return message.sendLocale('commandUnload', [{ type: piece.type, name: piece.name }]);
	}
}
