import { ModerationCommand, ModerationCommandOptions } from '@lib/structures/ModerationCommand';
import { GuildSettings } from '@lib/types/namespaces/GuildSettings';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { ArgumentTypes } from '@sapphire/utilities';
import { ApplyOptions } from '@skyra/decorators';
import { KlasaMessage } from 'klasa';

@ApplyOptions<ModerationCommandOptions>({
	aliases: ['un-restricted-attachment', 'ura'],
	description: (language) => language.get(LanguageKeys.Commands.Moderation.UnrestrictAttachmentDescription),
	extendedHelp: (language) => language.get(LanguageKeys.Commands.Moderation.UnrestrictAttachmentExtended),
	requiredGuildPermissions: ['MANAGE_ROLES']
})
export default class extends ModerationCommand {
	private readonly kPath = GuildSettings.Roles.RestrictedAttachment;

	public inhibit(message: KlasaMessage) {
		// If the command run is not this one (potentially help command) or the guild is null, return with no error.
		if (message.command !== this || message.guild === null) return false;
		const id = message.guild.settings.get(this.kPath);
		if (id && message.guild.roles.cache.has(id)) return false;
		throw message.language.get(LanguageKeys.Commands.Moderation.GuildSettingsRolesRestricted, {
			prefix: message.guild.settings.get(GuildSettings.Prefix),
			path: this.kPath
		});
	}

	public async prehandle() {
		/* Do nothing */
	}

	public async handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return message.guild!.security.actions.unRestrictAttachment(
			{
				userID: context.target.id,
				moderatorID: message.author.id,
				reason: context.reason
			},
			await this.getTargetDM(message, context.target)
		);
	}

	public async posthandle() {
		/* Do nothing */
	}
}
