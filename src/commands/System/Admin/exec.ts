import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types/Enums';
import { exec } from '#utils/Promisified/exec';
import { fetch, FetchMethods, FetchResultTypes } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { codeBlock } from '@sapphire/utilities';
import { Message, MessageAttachment } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['execute'],
	description: LanguageKeys.Commands.System.ExecDescription,
	extendedHelp: LanguageKeys.Commands.System.ExecExtended,
	guarded: true,
	permissionLevel: PermissionLevels.BotOwner,
	strategyOptions: { options: ['timeout'] }
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const input = await args.rest('string');
		const timeout = args.getOption('timeout');

		const result = await exec(input, { timeout: timeout ? Number(timeout) : 60000 }).catch((error) => ({
			stdout: null,
			stderr: error
		}));
		const output = result.stdout ? `**\`OUTPUT\`**${codeBlock('prolog', result.stdout)}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${codeBlock('prolog', result.stderr)}` : '';
		const joined = [output, outerr].join('\n') || 'No output';

		return message.send(
			joined.length > 2000 ? await this.getHaste(joined).catch(() => new MessageAttachment(Buffer.from(joined), 'output.txt')) : joined
		);
	}

	private async getHaste(result: string) {
		const { key } = (await fetch(`https://hastebin.skyra.pw/documents`, { method: FetchMethods.Post, body: result }, FetchResultTypes.JSON)) as {
			key: string;
		};
		return `https://hastebin.skyra.pw/${key}.js`;
	}
}
