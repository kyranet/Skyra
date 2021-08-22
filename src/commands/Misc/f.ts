import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { assetsFolder } from '#utils/constants';
import { addReaction, canReact } from '#utils/functions';
import { fetchAvatar } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@skyra/editable-commands';
import { Canvas, Image, resolveImage } from 'canvas-constructor/skia';
import type { Message, User } from 'discord.js';
import { join } from 'path';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['pray'],
	description: LanguageKeys.Commands.Misc.FDescription,
	extendedHelp: LanguageKeys.Commands.Misc.FExtended,
	requiredClientPermissions: ['ATTACH_FILES'],
	spam: true
})
export class UserCommand extends SkyraCommand {
	private kTemplate: Image = null!;
	private readonly responseReactionEmoji = encodeURIComponent('🇫');

	public async run(message: Message, args: SkyraCommand.Args) {
		const user = await args.pick('userName').catch(() => message.author);
		const attachment = await this.generate(user);
		const response = await send(message, { files: [{ attachment, name: 'F.png' }] });
		if (canReact(response)) await addReaction(response, this.responseReactionEmoji);
		return response;
	}

	public async generate(user: User) {
		const praised = await fetchAvatar(user, 256);

		return (
			new Canvas(960, 540)
				// Draw the avatar
				.setTransform(1, -0.1, 0.1, 1, 342, 88)
				.printImage(praised, 0, 0, 109, 109)

				// Draw the template
				.resetTransformation()
				.printImage(this.kTemplate, 0, 0, 960, 540)

				// Draw the buffer
				.png()
		);
	}

	public async onLoad() {
		this.kTemplate = await resolveImage(join(assetsFolder, './images/memes/f.png'));
	}
}
