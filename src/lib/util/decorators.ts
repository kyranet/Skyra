import type { GuildMessage } from '#lib/types';
import { PermissionLevels } from '#lib/types/Enums';
import { createFunctionPrecondition } from '@sapphire/decorators';
import { UserError } from '@sapphire/framework';
import { isAdmin, isModerator, isOwner } from './functions';

/**
 * Allows you to set permissions required for individual methods.
 * @remark This decorator makes the decorated function asynchronous.
 * @param permissionsResolvable Permissions that the method should have.
 * @param thrownError The error to be thrown. This gets assigned as the `identifier` property for a {@link UserError}
 * @param userErrorOptions Additional options to pass to the thrown {@link UserError}
 */
export const RequiresLevel = (
	level: PermissionLevels,
	thrownError: string,
	userErrorOptions?: Omit<UserError.Options, 'identifier'>
): MethodDecorator => {
	return createFunctionPrecondition(
		(message: GuildMessage) => {
			if (isOwner(message.member)) return true;

			switch (level) {
				case PermissionLevels.BotOwner:
					return false;
				case PermissionLevels.ServerOwner:
					return message.author.id === message.guild.ownerId;
				case PermissionLevels.Administrator:
					return isAdmin(message.member);
				case PermissionLevels.Moderator:
					return isModerator(message.member);
				case PermissionLevels.Everyone:
					return true;
			}
		},
		() => {
			throw new UserError({ identifier: thrownError, ...userErrorOptions });
		}
	);
};
