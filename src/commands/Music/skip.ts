import { Snowflake } from 'discord.js';
import { CommandStore, KlasaClient, KlasaMessage } from 'klasa';
import { Queue } from '../../lib/structures/music/Queue';
import { MusicCommand } from '../../lib/structures/MusicCommand';

export default class extends MusicCommand {

	public constructor(client: KlasaClient, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_SKIP_DESCRIPTION'),
			music: ['QUEUE_NOT_EMPTY'],
			usage: '[force]'
		});
	}

	public async run(message: KlasaMessage, [force = false]: [boolean]) {
		const { music } = message.guild;

		if (music.voiceChannel.members.size > 4) {
			if (force) {
				if (!await message.hasAtLeastPermissionLevel(5)) throw message.language.get('COMMAND_SKIP_PERMISSIONS');
			} else {
				const response = this.handleSkips(music, message.author.id);
				if (response) return message.sendMessage(response);
			}
		}

		await music.skip();
		return message.sendLocale('COMMAND_SKIP_SUCCESS', [music[0].title]);
	}

	public handleSkips(musicManager: Queue, user: Snowflake): string | false {
		if (!musicManager[0].skips) musicManager[0].skips.clear();
		if (musicManager[0].skips.has(user)) return musicManager.guild.language.get('COMMAND_SKIP_VOTES_VOTED');
		musicManager[0].skips.add(user);
		const members = musicManager.listeners.length;
		return this.shouldInhibit(musicManager, members, musicManager[0].skips.size);
	}

	public shouldInhibit(musicManager: Queue, total: number, size: number): false | string {
		if (total <= 3) return false;

		const needed = Math.ceil(total * 0.4);
		return size >= needed ? false : musicManager.guild.language.get('COMMAND_SKIP_VOTES_TOTAL', size, needed);
	}

}
