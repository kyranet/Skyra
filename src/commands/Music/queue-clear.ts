import { MusicCommand, MusicCommandOptions } from '@lib/structures/MusicCommand';
import { GuildMessage } from '@lib/types/Discord';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { ApplyOptions } from '@skyra/decorators';
import { requireDj, requireQueueNotEmpty } from '@utils/Music/Decorators';

@ApplyOptions<MusicCommandOptions>({
	aliases: ['qc', 'clear'],
	description: (language) => language.get(LanguageKeys.Commands.Music.ClearDescription)
})
export default class extends MusicCommand {
	@requireQueueNotEmpty()
	@requireDj()
	public async run(message: GuildMessage) {
		await message.guild.audio.clear();

		// TODO(kyranet): add message reply.
	}
}
