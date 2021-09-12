import { LanguageKeys } from '#lib/i18n/languageKeys';
import { RGB, SkyraCommand } from '#lib/structures';
import { hexConcat, luminance } from '#utils/Color';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Canvas, rgb } from 'canvas-constructor/skia';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import type { Message } from 'discord.js';

/* Color limiter */
const rL = (color: number) => color / 255;
const cL = (color: number) => Math.max(Math.min(color, 255), 0);
const sCL = (color: number) => (color >= 0.5 ? 0 : 255);

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['colour'],
	description: LanguageKeys.Commands.Tools.ColorDescription,
	extendedHelp: LanguageKeys.Commands.Tools.ColorExtended,
	requiredClientPermissions: [PermissionFlagsBits.AttachFiles]
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args) {
		const { hex, hsl, rgb } = await args.rest('color');

		const diff = await args.pick('integer', { minimum: 0, maximum: 255 }).catch(() => 10);

		const content = args.t(LanguageKeys.Commands.Tools.Color, { hex: hex.toString(), rgb: rgb.toString(), hsl: hsl.toString() });
		const attachment = await this.showColor(rgb, diff);
		return send(message, { content, files: [{ attachment, name: 'color.png' }] });
	}

	public showColor(color: RGB, diff: number) {
		const red = color.r;
		const green = color.g;
		const blue = color.b;

		const canvas = new Canvas(370, 390).setTextFont('18px FiraSans');

		this.processFrame(canvas, 5, 5, cL(red + diff * 2), cL(green), cL(blue));
		this.processFrame(canvas, 5, 125, cL(red + diff), cL(green + diff), cL(blue));
		this.processFrame(canvas, 5, 245, cL(red), cL(green + diff * 2), cL(blue));
		this.processFrame(canvas, 125, 5, cL(red + diff), cL(green), cL(blue + diff));
		this.processFrame(canvas, 125, 125, cL(red), cL(green), cL(blue));
		this.processFrame(canvas, 125, 245, cL(red - diff), cL(green), cL(blue - diff));
		this.processFrame(canvas, 245, 5, cL(red), cL(green), cL(blue + diff * 2));
		this.processFrame(canvas, 245, 125, cL(red - diff), cL(green - diff), cL(blue));
		this.processFrame(canvas, 245, 245, cL(red - diff * 2), cL(green - diff * 2), cL(blue - diff * 2));

		/* Complementary */
		const thisLum = sCL(luminance(rL(255 - red), rL(255 - green), rL(255 - blue)));
		return canvas
			.setColor(rgb(255 - red, 255 - green, 255 - blue))
			.printRectangle(5, 365, 360, 20)
			.setTextFont('16px FiraSans')
			.setColor(rgb(thisLum, thisLum, thisLum))
			.printText(hexConcat(255 - red, 255 - green, 255 - blue), 15, 382)
			.png();
	}

	public processFrame(ctx: Canvas, x: number, y: number, red: number, green: number, blue: number) {
		const lum = luminance(rL(red), rL(green), rL(blue));
		const textColor = sCL(lum);

		return ctx
			.setColor(rgb(red, green, blue))
			.printRectangle(x, y, 120, 120)
			.setColor(rgb(textColor, textColor, textColor))
			.printText(hexConcat(red, green, blue), x + 10, y + 20);
	}
}
