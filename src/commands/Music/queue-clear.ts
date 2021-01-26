import { requireDj, requireQueueNotEmpty } from '#lib/audio';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { MusicCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types/Discord';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<MusicCommand.Options>({
	aliases: ['qc', 'clear'],
	description: LanguageKeys.Commands.Music.ClearDescription,
	extendedHelp: LanguageKeys.Commands.Music.ClearExtended
})
export default class extends MusicCommand {
	@requireQueueNotEmpty()
	@requireDj()
	public async run(message: GuildMessage) {
		const { audio } = message.guild;
		const count = await audio.count();
		await audio.clearTracks();
		return message.channel.sendTranslated(LanguageKeys.Commands.Music.ClearSuccess, [{ count }]);
	}
}
