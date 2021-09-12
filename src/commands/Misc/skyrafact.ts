import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { PermissionFlags } from '#utils/constants';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Message, MessageEmbed } from 'discord.js';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['aifact', 'botfact'],
	description: LanguageKeys.Commands.Misc.SkyraFactDescription,
	extendedHelp: LanguageKeys.Commands.Misc.SkyraFactExtended,
	requiredClientPermissions: [PermissionFlags.EMBED_LINKS],
	spam: true
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const embed = new MessageEmbed()
			.setColor(await this.container.db.fetchColor(message))
			.setTitle(args.t(LanguageKeys.Commands.Misc.SkyraFactTitle))
			.setDescription(this.getLine(args));

		return send(message, { embeds: [embed] });
	}

	private getLine(args: SkyraCommand.Args) {
		const lines = args.t(LanguageKeys.Commands.Misc.SkyraFactMessages);
		const index = Math.floor(Math.random() * lines.length);
		return lines[index] || args.t(LanguageKeys.Commands.Misc.SkyraFactMessages, { lng: 'en-US' })[index];
	}
}
