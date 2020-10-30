import { Colors } from '@lib/types/constants/Constants';
import { Events } from '@lib/types/Enums';
import { LanguageKeys } from '@lib/types/namespaces/LanguageKeys';
import { codeBlock } from '@sapphire/utilities';
import { rootFolder } from '@utils/constants';
import { DiscordAPIError, HTTPError, MessageEmbed } from 'discord.js';
import { Command, Event, KlasaMessage } from 'klasa';

const BLACKLISTED_CODES = [
	// Unknown Channel
	10003,
	// Unknown Message
	10008
];

export default class extends Event {
	public async run(message: KlasaMessage, command: Command, _: string[], error: string | Error) {
		// If the error was a string (message from Skyra to not fire inhibitors), send it:
		if (typeof error === 'string') {
			try {
				return await message.alert(
					message.language.get(LanguageKeys.Events.ErrorString, { mention: message.author.toString(), message: error }),
					{
						allowedMentions: { users: [message.author.id], roles: [] }
					}
				);
			} catch (err) {
				return this.client.emit(Events.ApiError, err);
			}
		}

		// If the error was an AbortError, tell the user to re-try:
		if (error.name === 'AbortError') {
			this.client.emit(Events.Warn, `${this.getWarnError(message)} (${message.author.id}) | ${error.constructor.name}`);
			try {
				return await message.alert(message.language.get(LanguageKeys.System.DiscordAborterror));
			} catch (err) {
				return this.client.emit(Events.ApiError, err);
			}
		}

		// Extract useful information about the DiscordAPIError
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			if (BLACKLISTED_CODES.includes(error.code)) return;
			this.client.emit(Events.ApiError, error);
		} else {
			this.client.emit(Events.Warn, `${this.getWarnError(message)} (${message.author.id}) | ${error.constructor.name}`);
		}

		// Send a detailed message:
		await this.sendErrorChannel(message, command, error);

		// Emit where the error was emitted
		this.client.emit(Events.Wtf, `[COMMAND] ${command.path}\n${error.stack || error.message}`);
		try {
			await message.alert(
				this.client.options.owners.includes(message.author.id)
					? codeBlock('js', error.stack!)
					: message.language.get(LanguageKeys.Events.ErrorWtf)
			);
		} catch (err) {
			this.client.emit(Events.ApiError, err);
		}
	}

	private async sendErrorChannel(message: KlasaMessage, command: Command, error: Error) {
		const lines = [this.getLinkLine(message.url), this.getCommandLine(command), this.getArgumentsLine(message.args), this.getErrorLine(error)];

		// If it's a DiscordAPIError or a HTTPError, add the HTTP path and code lines after the second one.
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			lines.splice(2, 0, this.getPathLine(error), this.getCodeLine(error));
		}

		try {
			await this.client.webhookError.send(new MessageEmbed().setDescription(lines.join('\n')).setColor(Colors.Red).setTimestamp());
		} catch (err) {
			this.client.emit(Events.ApiError, err);
		}
	}

	/**
	 * Formats a message url line.
	 * @param url The url to format.
	 */
	private getLinkLine(url: string): string {
		return `[**Jump to Message!**](${url})`;
	}

	/**
	 * Formats a command line.
	 * @param command The command to format.
	 */
	private getCommandLine(command: Command): string {
		return `**Command**: ${command.path.slice(rootFolder.length)}`;
	}

	/**
	 * Formats an error path line.
	 * @param error The error to format.
	 */
	private getPathLine(error: DiscordAPIError | HTTPError): string {
		return `**Path**: ${error.path}`;
	}

	/**
	 * Formats an error code line.
	 * @param error The error to format.
	 */
	private getCodeLine(error: DiscordAPIError | HTTPError): string {
		return `**Code**: ${error.code}`;
	}

	/**
	 * Formats an arguments line.
	 * @param args The arguments the user used when running the command.
	 */
	private getArgumentsLine(args: readonly string[]): string {
		if (args.length === 0) return '**Arguments**: Not Supplied';
		return `**Arguments**: [\`${args.map((arg) => arg.trim() || '\u200B').join('`, `')}\`]`;
	}

	/**
	 * Formats an error codeblock.
	 * @param error The error to format.
	 */
	private getErrorLine(error: Error): string {
		return `**Error**: ${codeBlock('js', error.stack || error)}`;
	}

	private getWarnError(message: KlasaMessage) {
		return `ERROR: /${message.guild ? `${message.guild.id}/${message.channel.id}` : `DM/${message.author.id}`}/${message.id}`;
	}
}
