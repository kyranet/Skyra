import type { SkyraCommand } from '#lib/structures';
import { floatPromise, isGuildMessage, resolveOnErrorCodes } from '#utils/common';
import { canSendMessages } from '@sapphire/discord.js-utilities';
import { container } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { send } from '@skyra/editable-commands';
import { RESTJSONErrorCodes } from 'discord-api-types/v9';
import { Message, MessageOptions, Permissions, UserResolvable } from 'discord.js';
import { setTimeout as sleep } from 'timers/promises';

const messageCommands = new WeakMap<Message, SkyraCommand>();

/**
 * Sets or resets the tracking status of a message with a command.
 * @param message The message to track.
 * @param command The command that was run with the given message, if any.
 */
export function setCommand(message: Message, command: SkyraCommand | null) {
	if (command === null) messageCommands.delete(message);
	else messageCommands.set(message, command);
}

/**
 * Gets the tracked command from a message.
 * @param message The message to get the command from.
 * @returns The command that was run with the given message, if any.
 */
export function getCommand(message: Message): SkyraCommand | null {
	return messageCommands.get(message) ?? null;
}

/**
 * Determines whether or not we can reply to a message.
 * @param message The message to test permissions for.
 * @returns Whether or not we can reply to the given message.
 */
export function canReply(message: Message) {
	return canSendMessages(message.channel);
}

const canReactPermissions = new Permissions(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'ADD_REACTIONS']);

/**
 * Determines whether or not we can react to a message.
 * @param message The message to test permissions for.
 * @returns Whether or not we can react to the given message.
 */
export function canReact(message: Message) {
	return isGuildMessage(message) ? message.channel.permissionsFor(message.guild.me!)!.has(canReactPermissions) : true;
}

const canRemoveAllReactionsPermissions = new Permissions(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'MANAGE_MESSAGES']);

/**
 * Determines whether or not we can remove all reactions from a message.
 * @param message The message to test permissions for.
 * @returns Whether or not we can remove all reactions from the given message.
 */
export function canRemoveAllReactions(message: Message) {
	return isGuildMessage(message) ? message.channel.permissionsFor(message.guild.me!)!.has(canRemoveAllReactionsPermissions) : false;
}

async function deleteMessageImmediately(message: Message): Promise<Message> {
	return (await resolveOnErrorCodes(message.delete(), RESTJSONErrorCodes.UnknownMessage)) ?? message;
}

/**
 * Deletes a message, skipping if it was already deleted, and aborting if a non-zero timer was set and the message was
 * either deleted or edited.
 *
 * This also ignores the `UnknownMessage` error code.
 * @param message The message to delete.
 * @param time The amount of time, defaults to 0.
 * @returns The deleted message.
 */
export async function deleteMessage(message: Message, time = 0): Promise<Message> {
	if (message.deleted) return message;
	if (time === 0) return deleteMessageImmediately(message);

	const lastEditedTimestamp = message.editedTimestamp;
	await sleep(time);

	// If it was deleted or edited, cancel:
	if (message.deleted || message.editedTimestamp !== lastEditedTimestamp) {
		return message;
	}

	return deleteMessageImmediately(message);
}

/**
 * Sends a temporary editable message and then floats a {@link deleteMessage} with the given `timer`.
 * @param message The message to reply to.
 * @param options The options to be sent to the channel.
 * @param timer The timer in which the message should be deleted, using {@link deleteMessage}.
 * @returns The response message.
 */
export async function sendTemporaryMessage(message: Message, options: string | MessageOptions, timer = Time.Minute): Promise<Message> {
	if (typeof options === 'string') options = { content: options };

	const response = (await send(message, options)) as Message;
	floatPromise(deleteMessage(response, timer));
	return response;
}

/**
 * The prompt confirmation options.
 */
export interface PromptConfirmationMessageOptions extends MessageOptions {
	/**
	 * The target.
	 * @default message.author
	 */
	target?: UserResolvable;

	/**
	 * The time for the confirmation to run.
	 * @default Time.Minute
	 */
	time?: number;
}

const enum PromptConfirmationReactions {
	Yes = '🇾',
	No = '🇳'
}

async function promptConfirmationReaction(message: Message, response: Message, options: PromptConfirmationMessageOptions) {
	await response.react(PromptConfirmationReactions.Yes);
	await response.react(PromptConfirmationReactions.No);

	const target = container.client.users.resolveId(options.target ?? message.author)!;
	const reactions = await response.awaitReactions({ filter: (__, user) => user.id === target, time: Time.Minute, max: 1 });

	// Remove all reactions if the user has permissions to do so
	if (canRemoveAllReactions(response)) {
		floatPromise(response.reactions.removeAll());
	}

	return reactions.size === 0 ? null : reactions.firstKey() === PromptConfirmationReactions.Yes;
}

const promptConfirmationMessageRegExp = /^y|yes?|yeah?$/i;
async function promptConfirmationMessage(message: Message, response: Message, options: PromptConfirmationMessageOptions) {
	const target = container.client.users.resolveId(options.target ?? message.author)!;
	const messages = await response.channel.awaitMessages({ filter: (message) => message.author.id === target, time: Time.Minute, max: 1 });

	return messages.size === 0 ? null : promptConfirmationMessageRegExp.test(messages.first()!.content);
}

/**
 * Sends a boolean confirmation prompt asking the `target` for either of two choices.
 * @param message The message to ask for a confirmation from.
 * @param options The options for the message to be sent, alongside the prompt options.
 * @returns `null` if no response was given within the requested time, `boolean` otherwise.
 */
export async function promptConfirmation(message: Message, options: string | PromptConfirmationMessageOptions) {
	if (typeof options === 'string') options = { content: options };

	// TODO: v13 | Switch to buttons only when available.
	const response = await send(message, options);
	return canReact(response) ? promptConfirmationReaction(message, response, options) : promptConfirmationMessage(message, response, options);
}

export async function promptForMessage(message: Message, sendOptions: string | MessageOptions, time = Time.Minute): Promise<string | null> {
	const response = await message.channel.send(sendOptions);
	const responses = await message.channel.awaitMessages({ filter: (msg) => msg.author === message.author, time, max: 1 });
	floatPromise(deleteMessage(response));

	return responses.size === 0 ? null : responses.first()!.content;
}
