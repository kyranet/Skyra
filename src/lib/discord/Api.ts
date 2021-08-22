import { container } from '@sapphire/framework';
import type { Snowflake } from 'discord-api-types';

export function api() {
	return Reflect.get(container.client, 'api') as Api;
}

interface Api {
	channels: ApiChannels;
	guilds: ApiGuilds;
	invites: ApiInvites;
	users: ApiUsers;
	voice: ApiVoice;
	webhooks: ApiWebhooks;
}

interface ApiChannels {
	(channelId: Snowflake): ApiChannelsChannel;
}

/**
 * @endpoint /channels/{channel.id}
 */
interface ApiChannelsChannel {
	/**
	 * Get a channel by ID. Returns a channel object.
	 * @url https://discord.com/developers/docs/resources/channel#get-channel
	 */
	get: ApiMethods['get'];

	/**
	 * Update a channel's settings. Requires the `MANAGE_CHANNELS` permission for the guild. Returns a channel on
	 * success, and a 400 BAD REQUEST on invalid parameters. Fires a Channel Update Gateway event. If modifying a
	 * category, individual Channel Update events will fire for each child channel that also changes.
	 * @url https://discord.com/developers/docs/resources/channel#modify-channel
	 */
	put: ApiMethods['put'];

	/**
	 * Update a channel's settings. Requires the `MANAGE_CHANNELS` permission for the guild. Returns a channel on
	 * success, and a 400 BAD REQUEST on invalid parameters. Fires a Channel Update Gateway event. If modifying a
	 * category, individual Channel Update events will fire for each child channel that also changes.
	 * @url https://discord.com/developers/docs/resources/channel#modify-channel
	 */
	patch: ApiMethods['patch'];

	/**
	 * Delete a channel, or close a private message. Requires the `MANAGE_CHANNELS` permission for the guild. Deleting a
	 * category does not delete its child channels; they will have their `parent_id` removed and a Channel Update
	 * Gateway event will fire for each of them. Returns a channel object on success. Fires a Channel Delete Gateway
	 * event.
	 * @url https://discord.com/developers/docs/resources/channel#deleteclose-channel
	 */
	delete: ApiMethods['delete'];

	/**
	 * Messages endpoints.
	 */
	messages: ApiChannelsChannelMessages;

	/**
	 * Permissions endpoints.
	 */
	permissions: ApiChannelsChannelPermissions;

	/**
	 * Invites endpoints.
	 */
	invites: ApiChannelsChannelInvites;

	/**
	 * Typing endpoints.
	 */
	typing: ApiChannelsChannelTyping;

	/**
	 * Pins endpoints.
	 */
	pins: ApiChannelsChannelPins;

	/**
	 * Webhook endpoints.
	 */
	webhooks: ApiChannelsChannelWebhooks;
}

/**
 * @endpoint /channels/{channel.id}/messages
 */
interface ApiChannelsChannelMessages {
	/**
	 * Returns the messages for a channel. If operating on a guild channel, this endpoint requires the `VIEW_CHANNEL`
	 * permission to be present on the current user. If the current user is missing the `READ_MESSAGE_HISTORY`
	 * permission in the channel then this will return no messages (since they cannot read the message history). Returns
	 * an array of message objects on success.
	 * @url https://discord.com/developers/docs/resources/channel#get-channel-messages
	 */
	get: ApiMethods['get'];

	/**
	 * Post a message to a guild text or DM channel. If operating on a guild channel, this endpoint requires the
	 * `SEND_MESSAGES` permission to be present on the current user. If the `tts` field is set to `true`, the
	 * `SEND_TTS_MESSAGES` permission is required for the message to be spoken. Returns a message object. Fires a
	 * Message Create Gateway event. See message formatting for more information on how to properly format messages.
	 * @url https://discord.com/developers/docs/resources/channel#create-message
	 */
	post: ApiMethods['post'];

	/**
	 * Bulk delete endpoints.
	 */
	'bulk-delete': ApiChannelsChannelMessagesBulkDelete;

	(messageId: Snowflake): ApiChannelsChannelMessagesMessage;
}

/**
 * @endpoint /channels/{channel.id}/messages/{message.id}
 */
interface ApiChannelsChannelMessagesMessage {
	/**
	 * Returns a specific message in the channel. If operating on a guild channel, this endpoint requires the
	 * `READ_MESSAGE_HISTORY` permission to be present on the current user. Returns a message object on success.
	 * @url https://discord.com/developers/docs/resources/channel#get-channel-message
	 */
	get: ApiMethods['get'];

	/**
	 * Edit a previously sent message. You can only edit messages that have been sent by the current user. Returns a
	 * message object. Fires a Message Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/channel#edit-message
	 */
	patch: ApiMethods['patch'];

	/**
	 * Delete a message. If operating on a guild channel and trying to delete a message that was not sent by the current
	 * user, this endpoint requires the `MANAGE_MESSAGES` permission. Returns a 204 empty response on success. Fires a
	 * Message Delete Gateway event.
	 * @url https://discord.com/developers/docs/resources/channel#delete-message
	 */
	delete: ApiMethods['delete'];

	reactions: ApiChannelsChannelMessagesMessageReactions;
}

/**
 * @endpoint /channels/{channel.id}/messages/{message.id}/reactions
 */
interface ApiChannelsChannelMessagesMessageReactions {
	/**
	 * Deletes all reactions on a message. This endpoint requires the `MANAGE_MESSAGES` permission to be present on the
	 * current user.
	 * @url https://discord.com/developers/docs/resources/channel#delete-all-reactions
	 */
	delete: ApiMethods['delete'];

	(emoji: string): ApiChannelsChannelMessagesMessageReactionsEmoji;
	(emoji: string, userId: '@me'): ApiChannelsChannelMessagesMessageReactionsEmojiMe;
	(emoji: string, userId: Snowflake): ApiChannelsChannelMessagesMessageReactionsEmojiUser;
}

/**
 * @endpoint /channels/{channel.id}/messages/{message.id}/reactions/{emoji}
 */
interface ApiChannelsChannelMessagesMessageReactionsEmoji {
	/**
	 * Get a list of users that reacted with this emoji. Returns an array of user objects on success.
	 * @url https://discord.com/developers/docs/resources/channel#get-reactions
	 */
	get: ApiMethods['get'];

	/**
	 * Deletes all the reactions for a given emoji on a message. This endpoint requires the `MANAGE_MESSAGES` permission
	 * to be present on the current user.
	 * @url https://discord.com/developers/docs/resources/channel#delete-all-reactions-for-emoji
	 */
	delete: ApiMethods['delete'];

	(userId: '@me'): ApiChannelsChannelMessagesMessageReactionsEmojiMe;
	<T extends R<ApiChannelsChannelMessagesMessageReactionsEmojiMe>>(userId: '@me', key: T): ApiChannelsChannelMessagesMessageReactionsEmojiMe[T];

	(userId: Snowflake): ApiChannelsChannelMessagesMessageReactionsEmojiUser;
	<T extends R<ApiChannelsChannelMessagesMessageReactionsEmojiUser>>(
		userId: Snowflake,
		key: T
	): ApiChannelsChannelMessagesMessageReactionsEmojiUser[T];
}

/**
 * @endpoint /channels/{channel.id}/messages/{message.id}/reactions/{emoji}/@me
 */
interface ApiChannelsChannelMessagesMessageReactionsEmojiMe {
	/**
	 * Create a reaction for the message. `emoji` takes the form of `name:id` for custom guild emoji, or Unicode
	 * characters. This endpoint requires the 'READ_MESSAGE_HISTORY' permission to be present on the current user.
	 * Additionally, if nobody else has reacted to the message using this emoji, this endpoint requires the
	 * `ADD_REACTIONS` permission to be present on the current user. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/channel#create-reaction
	 */
	put: ApiMethods['put'];

	/**
	 * Delete a reaction the current user has made for the message. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/channel#delete-own-reaction
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /channels/{channel.id}/messages/{message.id}/reactions/{emoji}/{user.id}
 */
interface ApiChannelsChannelMessagesMessageReactionsEmojiUser {
	/**
	 * Deletes another user's reaction. This endpoint requires the `MANAGE_MESSAGES` permission to be present on the
	 * current user. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/channel#delete-user-reaction
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /channels/{channel.id}/messages/bulk-delete
 */
interface ApiChannelsChannelMessagesBulkDelete {
	/**
	 * Delete multiple messages in a single request. This endpoint can only be used on guild channels and requires the
	 * `MANAGE_MESSAGES` permission. Returns a 204 empty response on success. Fires a Message Delete Bulk Gateway event.
	 *
	 * Any message IDs given that do not exist or are invalid will count towards the minimum and maximum message count
	 * (currently 2 and 100 respectively). Additionally, duplicated IDs will only be counted once.
	 */
	post: ApiMethods['post'];
}

interface ApiChannelsChannelPermissions {
	(permissionId: string): ApiChannelsChannelPermissionsPermission;
}

/**
 * @endpoint /channels/{channel.id}/permissions/{overwrite.id}
 */
interface ApiChannelsChannelPermissionsPermission {
	/**
	 * Edit the channel permission overwrites for a user or role in a channel. Only usable for guild channels. Requires
	 * the `MANAGE_ROLES` permission. Returns a 204 empty response on success. For more information about permissions,
	 * see permissions.
	 * @url https://discord.com/developers/docs/resources/channel#edit-channel-permissions
	 */
	put: ApiMethods['put'];

	/**
	 * Delete a channel permission overwrite for a user or role in a channel. Only usable for guild channels. Requires
	 * the `MANAGE_ROLES` permission. Returns a 204 empty response on success. For more information about permissions,
	 * see permissions.
	 * @url https://discord.com/developers/docs/resources/channel#delete-channel-permission
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /channels/{channel.id}/invites
 */
interface ApiChannelsChannelInvites {
	/**
	 * Returns a list of invite objects (with invite metadata) for the channel. Only usable for guild channels. Requires
	 * the `MANAGE_CHANNELS` permission.
	 * @url https://discord.com/developers/docs/resources/channel#get-channel-invites
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new invite object for the channel. Only usable for guild channels. Requires the `CREATE_INSTANT_INVITE`
	 * permission. All JSON parameters for this route are optional, however the request body is not. If you are not
	 * sending any fields, you still have to send an empty JSON object (`{}`). Returns an invite object.
	 * @url https://discord.com/developers/docs/resources/channel#create-channel-invite
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /channels/{channel.id}/typing
 */
interface ApiChannelsChannelTyping {
	/**
	 * Post a typing indicator for the specified channel. Generally bots should not implement this route. However, if a
	 * bot is responding to a command and expects the computation to take a few seconds, this endpoint may be called to
	 * let the user know that the bot is processing their message. Returns a 204 empty response on success. Fires a
	 * Typing Start Gateway event.
	 * @url https://discord.com/developers/docs/resources/channel#trigger-typing-indicator
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /channels/{channel.id}/pins
 */
interface ApiChannelsChannelPins {
	/**
	 * Returns all pinned messages in the channel as an array of message objects.
	 * @url https://discord.com/developers/docs/resources/channel#get-pinned-messages
	 */
	get: ApiMethods['get'];

	(messageId: Snowflake): ApiChannelsChannelPinsMessage;
}

/**
 * @endpoint /channels/{channel.id}/pins/{message.id}
 */
interface ApiChannelsChannelPinsMessage {
	/**
	 * Pin a message in a channel. Requires the `MANAGE_MESSAGES` permission. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/channel#add-pinned-channel-message
	 */
	put: ApiMethods['put'];

	/**
	 * Delete a pinned message in a channel. Requires the `MANAGE_MESSAGES` permission. Returns a 204 empty response on
	 * success.
	 * @url https://discord.com/developers/docs/resources/channel#delete-pinned-channel-message
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /channels/{channel.id}/webhooks
 */
interface ApiChannelsChannelWebhooks {
	/**
	 * Returns a list of channel webhook objects. Requires the `MANAGE_WEBHOOKS` permission.
	 * @url https://discord.com/developers/docs/resources/webhook#get-channel-webhooks
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new webhook. Requires the `MANAGE_WEBHOOKS` permission. Returns a webhook object on success.
	 * @url https://discord.com/developers/docs/resources/webhook#create-webhook
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /guilds
 */
interface ApiGuilds {
	/**
	 * Create a new guild. Returns a guild object on success. Fires a Guild Create Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#create-guild
	 */
	post: ApiMethods['post'];

	(guildId: Snowflake): ApiGuildsGuild;
	<T extends R<ApiGuildsGuild>>(guildId: Snowflake, key: T): ApiGuildsGuild[T];
	<T extends R<ApiGuildsGuild>, S extends R<ApiGuildsGuild[T]>>(guildId: Snowflake, key: T, subKey: S): ApiGuildsGuild[T][S];
}

/**
 * @endpoint /guilds/{guild.id}
 */
interface ApiGuildsGuild {
	/**
	 * Returns the guild object for the given id.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild
	 */
	get: ApiMethods['get'];

	/**
	 * Modify a guild's settings. Requires the `MANAGE_GUILD` permission. Returns the updated guild object on success.
	 * Fires a Guild Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild
	 */
	patch: ApiMethods['patch'];

	/**
	 * Delete a guild permanently. User must be owner. Returns `204 No Content` on success. Fires a Guild Delete Gateway
	 * event.
	 * @url https://discord.com/developers/docs/resources/guild#delete-guild
	 */
	delete: ApiMethods['delete'];

	/**
	 * Channel endpoints.
	 */
	channels: ApiGuildsGuildChannels;

	/**
	 * Member endpoints.
	 */
	members: ApiGuildsGuildMembers;

	/**
	 * Ban endpoints.
	 */
	bans: ApiGuildsGuildBans;

	/**
	 * Role endpoints.
	 */
	roles: ApiGuildsGuildRoles;

	/**
	 * Prune endpoints.
	 */
	prune: ApiGuildsGuildPrune;

	/**
	 * Region endpoints.
	 */
	regions: ApiGuildsGuildRegions;

	/**
	 * Invite endpoints.
	 */
	invites: ApiGuildsGuildInvites;

	/**
	 * Integration endpoints.
	 */
	integrations: ApiGuildsGuildIntegrations;

	/**
	 * Emojis endpoints.
	 */
	emojis: ApiGuildsGuildEmojis;

	/**
	 * Webhook endpoints.
	 */
	webhooks: ApiGuildsGuildWebhooks;

	/**
	 * Embed endpoints.
	 */
	embed: ApiGuildsGuildEmbed;

	/**
	 * Vanity URL endpoints.
	 */
	'vanity-url': ApiGuildsGuildVanityUrl;

	/**
	 * Widget endpoints.
	 */
	'widget.png': ApiGuildsGuildWidget;

	/**
	 * Audit-Logs endpoints.
	 */
	'audit-logs': ApiGuildsGuildAuditLogs;
}

/**
 * @endpoint /guilds/{guild.id}/channels
 */
interface ApiGuildsGuildChannels {
	/**
	 * Returns a list of guild channel objects.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-channels
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new channel object for the guild. Requires the `MANAGE_CHANNELS` permission. Returns the new channel
	 * object on success. Fires a Channel Create Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#create-guild-channel
	 */
	post: ApiMethods['post'];

	/**
	 * Modify the positions of a set of channel objects for the guild. Requires `MANAGE_CHANNELS` permission. Returns a
	 * 204 empty response on success. Fires multiple Channel Update Gateway events.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild-channel-positions
	 */
	patch: ApiMethods['patch'];
}

/**
 * @endpoint /guilds/{guild.id}/members
 */
interface ApiGuildsGuildMembers {
	/**
	 * Returns a list of guild member objects that are members of the guild.
	 * @url https://discord.com/developers/docs/resources/guild#list-guild-members
	 */
	get: ApiMethods['get'];

	'@me': ApiGuildsGuildMembersMe;

	search: APiGuildsGuildMembersFetch;

	(memberId: '@me'): ApiGuildsGuildMembersMe;
	<T extends R<ApiGuildsGuildMembersMe>>(memberId: '@me', key: T): ApiGuildsGuildMembersMe[T];

	(memberId: Snowflake): ApiGuildsGuildMembersMember;
	<T extends R<ApiGuildsGuildMembersMember>>(memberId: Snowflake, key: T): ApiGuildsGuildMembersMember[T];
}

/**
 * @endpoint /guilds/{guild.id}/members/{user.id}
 */
interface ApiGuildsGuildMembersMember {
	/**
	 * Returns a guild member object for the specified user.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-member
	 */
	get: ApiMethods['get'];

	/**
	 * Adds a user to the guild, provided you have a valid oauth2 access token for the user with the `guilds.join`
	 * scope. Returns a 201 Created with the guild member as the body, or 204 No Content if the user is already a member
	 * of the guild. Fires a Guild Member Add Gateway event. Requires the bot to have the `CREATE_INSTANT_INVITE`
	 * permission.
	 * @url https://discord.com/developers/docs/resources/guild#add-guild-member
	 */
	put: ApiMethods['put'];

	/**
	 * Modify attributes of a guild member. Returns a 204 empty response on success. Fires a Guild Member Update Gateway
	 * event. If the `channel_id` is set to null, this will force the target user to be disconnected from voice.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild-member
	 */
	patch: ApiMethods['patch'];

	/**
	 * Remove a member from a guild. Requires `KICK_MEMBERS` permission. Returns a 204 empty response on success. Fires
	 * a Guild Member Remove Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#remove-guild-member
	 */
	delete: ApiMethods['delete'];

	roles: ApiGuildsGuildMembersMemberRoles;
}

interface ApiGuildsGuildMembersMemberRoles {
	(roleId: Snowflake): ApiGuildsGuildMembersMemberRolesRole;
}

/**
 * @endpoint /guilds/{guild.id}/members/{user.id}/roles/{role.id}
 */
interface ApiGuildsGuildMembersMemberRolesRole {
	/**
	 * Adds a role to a guild member. Requires the `MANAGE_ROLES` permission. Returns a 204 empty response on success.
	 * Fires a Guild Member Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#add-guild-member-role
	 */
	put: ApiMethods['put'];

	/**
	 * Removes a role from a guild member. Requires the `MANAGE_ROLES` permission. Returns a 204 empty response on
	 * success. Fires a Guild Member Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#remove-guild-member-role
	 */
	delete: ApiMethods['delete'];
}

interface ApiGuildsGuildMembersMe {
	nick: ApiGuildsGuildMembersMeNick;
}

interface APiGuildsGuildMembersFetch {
	get: ApiMethods['get'];
}

/**
 * @endpoint /guilds/{guild.id}/members/@me/nick
 */
interface ApiGuildsGuildMembersMeNick {
	/**
	 * Modifies the nickname of the current user in a guild. Returns a 200 with the nickname on success. Fires a Guild
	 * Member Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#modify-current-user-nick
	 */
	patch: ApiMethods['patch'];
}

/**
 * @endpoint /guilds/{guild.id}/bans
 */
interface ApiGuildsGuildBans {
	/**
	 * Returns a list of ban objects for the users banned from this guild. Requires the `BAN_MEMBERS` permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-bans
	 */
	get: ApiMethods['get'];

	(userId: Snowflake): ApiGuildsGuildBansUser;
}

/**
 * @endpoint /guilds/{guild.id}/bans/{user.id}
 */
interface ApiGuildsGuildBansUser {
	/**
	 * Returns a ban object for the given user or a 404 not found if the ban cannot be found. Requires the `BAN_MEMBERS`
	 * permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-ban
	 */
	get: ApiMethods['get'];

	/**
	 * Create a guild ban, and optionally delete previous messages sent by the banned user. Requires the `BAN_MEMBERS`
	 * permission. Returns a 204 empty response on success. Fires a Guild Ban Add Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#create-guild-ban
	 */
	put: ApiMethods['put'];

	/**
	 * Remove the ban for a user. Requires the `BAN_MEMBERS` permissions. Returns a 204 empty response on success. Fires
	 * a Guild Ban Remove Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#remove-guild-ban
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /guilds/{guild.id}/roles
 */
interface ApiGuildsGuildRoles {
	/**
	 * Returns a list of role objects for the guild.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-roles
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new role for the guild. Requires the `MANAGE_ROLES` permission. Returns the new role object on success.
	 * Fires a Guild Role Create Gateway event. All JSON params are optional.
	 * @url https://discord.com/developers/docs/resources/guild#create-guild-role
	 */
	post: ApiMethods['post'];

	/**
	 * Modify the positions of a set of role objects for the guild. Requires the `MANAGE_ROLES` permission. Returns a
	 * list of all of the guild's role objects on success. Fires multiple Guild Role Update Gateway events.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild-role-positions
	 */
	patch: ApiMethods['patch'];

	(roleId: Snowflake): ApiGuildsGuildRolesRole;
}

/**
 * @endpoint /guilds/{guild.id}/roles/{role.id}
 */
interface ApiGuildsGuildRolesRole {
	/**
	 * Delete a guild role. Requires the `MANAGE_ROLES` permission. Returns a 204 empty response on success. Fires a
	 * Guild Role Delete Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#delete-guild-role
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /guilds/{guild.id}/prune
 */
interface ApiGuildsGuildPrune {
	/**
	 * Returns an object with one 'pruned' key indicating the number of members that would be removed in a prune
	 * operation. Requires the `KICK_MEMBERS` permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-prune-count
	 */
	get: ApiMethods['get'];

	/**
	 * Begin a prune operation. Requires the `KICK_MEMBERS` permission. Returns an object with one 'pruned' key
	 * indicating the number of members that were removed in the prune operation. For large guilds it's recommended to
	 * set the `compute_prune_count` option to `false`, forcing 'pruned' to `null`. Fires multiple Guild Member Remove
	 * Gateway events.
	 * @url https://discord.com/developers/docs/resources/guild#begin-guild-prune
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /guilds/{guild.id}/regions
 */
interface ApiGuildsGuildRegions {
	/**
	 * Returns a list of voice region objects for the guild. Unlike the similar `/voice` route, this returns VIP servers
	 * when the guild is VIP-enabled.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-voice-regions
	 */
	get: ApiMethods['get'];
}

/**
 * @endpoint /guilds/{guild.id}/invites
 */
interface ApiGuildsGuildInvites {
	/**
	 * Returns a list of invite objects (with invite metadata) for the guild. Requires the `MANAGE_GUILD` permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-invites
	 */
	get: ApiMethods['get'];
}

/**
 * @endpoint /guilds/{guild.id}/integrations
 */
interface ApiGuildsGuildIntegrations {
	/**
	 * Returns a list of integration objects for the guild. Requires the `MANAGE_GUILD` permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-integrations
	 */
	get: ApiMethods['get'];

	/**
	 * Attach an integration object from the current user to the guild. Requires the `MANAGE_GUILD` permission. Returns
	 * a 204 empty response on success. Fires a Guild Integrations Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#create-guild-integration
	 */
	post: ApiMethods['post'];

	/**
	 * Modify the behavior and settings of an integration object for the guild. Requires the `MANAGE_GUILD` permission.
	 * Returns a 204 empty response on success. Fires a Guild Integrations Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild-integration
	 */
	patch: ApiMethods['patch'];

	(integrationId: Snowflake): ApiGuildsGuildIntegrationsIntegration;
	<T extends R<ApiGuildsGuildIntegrationsIntegration>>(integrationId: Snowflake, key: T): ApiGuildsGuildIntegrationsIntegration[T];
}

/**
 * @endpoint /guilds/{guild.id}/integrations/{integration.id}
 */
interface ApiGuildsGuildIntegrationsIntegration {
	/**
	 * Delete the attached integration object for the guild. Requires the `MANAGE_GUILD` permission. Returns a 204 empty
	 * response on success. Fires a Guild Integrations Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/guild#delete-guild-integration
	 */
	delete: ApiMethods['delete'];

	sync: ApiGuildsGuildIntegrationsIntegrationSync;
}

/**
 * @endpoint /guilds/{guild.id}/integrations/{integration.id}/sync
 */
interface ApiGuildsGuildIntegrationsIntegrationSync {
	/**
	 * Sync an integration. Requires the `MANAGE_GUILD` permission. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/guild#sync-guild-integration
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /guilds/{guild.id}/emojis
 */
interface ApiGuildsGuildEmojis {
	/**
	 * Returns a list of emoji objects for the given guild.
	 * @url https://discord.com/developers/docs/resources/emoji#list-guild-emojis
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new emoji for the guild. Requires the `MANAGE_EMOJIS` permission. Returns the new emoji object on
	 * success. Fires a Guild Emojis Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/emoji#create-guild-emoji
	 */
	post: ApiMethods['post'];

	(emoji: string): ApiGuildsGuildEmojisEmoji;
}

/**
 * @endpoint /guilds/{guild.id}/emojis/{emoji.id}
 */
interface ApiGuildsGuildEmojisEmoji {
	/**
	 * Returns an emoji object for the given guild and emoji IDs.
	 * @url https://discord.com/developers/docs/resources/emoji#get-guild-emoji
	 */
	get: ApiMethods['get'];

	/**
	 * Modify the given emoji. Requires the `MANAGE_EMOJIS` permission. Returns the updated emoji object on success.
	 * Fires a Guild Emojis Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/emoji#modify-guild-emoji
	 */
	patch: ApiMethods['patch'];

	/**
	 * Delete the given emoji. Requires the `MANAGE_EMOJIS` permission. Returns `204 No Content` on success. Fires a
	 * Guild Emojis Update Gateway event.
	 * @url https://discord.com/developers/docs/resources/emoji#delete-guild-emoji
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /guilds/{guild.id}/webhooks
 */
interface ApiGuildsGuildWebhooks {
	/**
	 * Returns a list of guild webhook objects. Requires the `MANAGE_WEBHOOKS` permission.
	 * @url https://discord.com/developers/docs/resources/webhook#get-guild-webhooks
	 */
	get: ApiMethods['get'];
}

/**
 * @endpoint /guilds/{guild.id}/embed
 */
interface ApiGuildsGuildEmbed {
	/**
	 * Returns the guild embed object. Requires the `MANAGE_GUILD` permission.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-embed
	 */
	get: ApiMethods['get'];

	/**
	 * Modify a guild embed object for the guild. All attributes may be passed in with JSON and modified. Requires the
	 * `MANAGE_GUILD` permission. Returns the updated guild embed object.
	 * @url https://discord.com/developers/docs/resources/guild#modify-guild-embed
	 */
	patch: ApiMethods['patch'];
}

/**
 * @endpoint /guilds/{guild.id}/vanity-url
 */
interface ApiGuildsGuildVanityUrl {
	/**
	 * Returns a partial invite object for guilds with that feature enabled. Requires the `MANAGE_GUILD` permission.
	 * `code` will be null if a vanity url for the guild is not set.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-vanity-url
	 */
	get: ApiMethods['get'];
}

/**
 * /guilds/{guild.id}/widget.png
 */
interface ApiGuildsGuildWidget {
	/**
	 * Returns a PNG image widget for the guild. Requires no permissions or authentication. The same documentation also
	 * applies to `embed.png`.
	 * @url https://discord.com/developers/docs/resources/guild#get-guild-widget-image
	 */
	get: ApiMethods['get'];
}

/**
 * /guilds/{guild.id}/audit-logs
 */
interface ApiGuildsGuildAuditLogs {
	get: ApiMethods['get'];
}

interface ApiInvites {
	(inviteId: string): ApiInvitesInvite;
}

/**
 * @endpoint /invites/{invite.code}
 */
interface ApiInvitesInvite {
	/**
	 * Returns an invite object for the given code.
	 * @url https://discord.com/developers/docs/resources/invite#get-invite
	 */
	get: ApiMethods['get'];

	/**
	 * Delete an invite. Requires the `MANAGE_CHANNELS` permission on the channel this invite belongs to, or
	 * `MANAGE_GUILD` to remove any invite across the guild. Returns an invite object on success.
	 * @url https://discord.com/developers/docs/resources/invite#delete-invite
	 */
	delete: ApiMethods['delete'];
}

interface ApiUsers {
	'@me': ApiUsersMe;

	(userId: '@me'): ApiUsersMe;
	<T extends R<ApiUsersMe>>(userId: '@me', key: T): ApiUsersMe[T];
	<T extends R<ApiUsersMe>, S extends R<ApiUsersMe[T]>>(userId: '@me', key: T, subKey: S): ApiUsersMe[T][S];

	(userId: Snowflake): ApiUsersUser;
}

/**
 * @endpoint /users/{user.id}
 */
interface ApiUsersUser {
	/**
	 * Returns a user object for a given user ID.
	 * @url https://discord.com/developers/docs/resources/user#get-user
	 */
	get: ApiMethods['get'];
}

/**
 * @endpoint /users/@me
 */
interface ApiUsersMe {
	/**
	 * Returns the user object of the requester's account. For OAuth2, this requires the identify scope, which will
	 * return the object without an email, and optionally the email scope, which returns the object with an email.
	 * @url https://discord.com/developers/docs/resources/user#get-current-user
	 */
	get: ApiMethods['get'];

	/**
	 * Modify the requester's user account settings. Returns a user object on success.
	 * @url https://discord.com/developers/docs/resources/user#modify-current-user
	 */
	patch: ApiMethods['patch'];

	/**
	 * Guild-related endpoints.
	 */
	guilds: ApiUsersMeGuilds;

	/**
	 * Channel-related endpoints.
	 */
	channels: ApiUsersMeChannels;

	/**
	 * Connection-related endpoints.
	 */
	connections: ApiUsersMeConnections;
}

/**
 * @endpoint /users/@me/guilds
 */
interface ApiUsersMeGuilds {
	/**
	 * Returns a list of partial guild objects the current user is a member of. Requires the `guilds` OAuth2 scope.
	 * @url https://discord.com/developers/docs/resources/user#get-current-user-guilds
	 */
	get: ApiMethods['get'];

	/**
	 * Guild-related endpoints.
	 */
	(guildId: Snowflake): ApiUsersMeGuildsGuild;
}

/**
 * @endpoint /users/@me/guilds/{guild.id}
 */
interface ApiUsersMeGuildsGuild {
	/**
	 * Leave a guild. Returns a 204 empty response on success.
	 * @url https://discord.com/developers/docs/resources/user#leave-guild
	 */
	delete: ApiMethods['delete'];
}

/**
 * @endpoint /users/@me/channels
 */
interface ApiUsersMeChannels {
	/**
	 * Returns a list of DM channel objects. For bots, this is no longer a supported method of getting recent DMs, and
	 * will return an empty array.
	 * @url https://discord.com/developers/docs/resources/user#get-user-dms
	 */
	get: ApiMethods['get'];

	/**
	 * Create a new DM channel with a user. Returns a DM channel object.
	 * @url https://discord.com/developers/docs/resources/user#create-dm
	 */
	post: ApiMethods['post'];
}

interface ApiUsersMeConnections {
	/**
	 * Returns a list of connection objects. Requires the `connections` OAuth2 scope.
	 * @url https://discord.com/developers/docs/resources/user#get-user-connections
	 */
	get: ApiMethods['get'];
}

interface ApiVoice {
	regions: ApiVoiceRegions;
}

/**
 * @endpoint /voice/regions
 */
interface ApiVoiceRegions {
	/**
	 * Returns an array of voice region objects that can be used when creating servers.
	 * @url https://discord.com/developers/docs/resources/voice#list-voice-regions
	 */
	get: ApiMethods['get'];
}

interface ApiWebhooks {
	/**
	 * Access to a webhook by its ID.
	 */
	(webhookId: Snowflake): ApiWebhooksWebhook;
}

/**
 * @endpoint /webhooks/{webhook.id}
 */
interface ApiWebhooksWebhook {
	/**
	 * Returns the new webhook object for the given id.
	 * @url https://discord.com/developers/docs/resources/webhook#get-webhook
	 */
	get: ApiMethods['get'];

	/**
	 * Modify a webhook. Requires the `MANAGE_WEBHOOKS` permission. Returns the updated webhook object on success.
	 * @url https://discord.com/developers/docs/resources/webhook#modify-webhook
	 */
	patch: ApiMethods['patch'];

	/**
	 * Delete a webhook permanently. User must be owner. Returns a 204 NO CONTENT response on success.
	 * @url https://discord.com/developers/docs/resources/webhook#delete-webhook
	 */
	delete: ApiMethods['delete'];

	/**
	 * Access to a token.
	 */
	(token: string): ApiWebhooksWebhookToken;
}

/**
 * @endpoint /webhooks/{webhook.id}/{webhook.token}
 */
interface ApiWebhooksWebhookToken {
	/**
	 * Same as the non-token version, except this call does not require authentication and returns no user in the
	 * webhook object.
	 * @url https://discord.com/developers/docs/resources/webhook#get-webhook-with-token
	 */
	get: ApiMethods['get'];

	/**
	 * Same as the non-token version, except this call does not require authentication, does not accept a `channel_id`
	 * parameter in the body, and does not return a user in the webhook object.
	 * @url https://discord.com/developers/docs/resources/webhook#modify-webhook-with-token
	 */
	patch: ApiMethods['patch'];

	/**
	 * Same as the non-token version, except this call does not require authentication.
	 * @url https://discord.com/developers/docs/resources/webhook#delete-webhook-with-token
	 */
	delete: ApiMethods['delete'];

	/**
	 * Sends a message.
	 * @url https://discord.com/developers/docs/resources/webhook#execute-webhook
	 */
	post: ApiMethods['post'];

	/**
	 * The slack endpoint.
	 */
	slack: ApiWebhooksWebhookTokenSlack;

	/**
	 * The github endpoint.
	 */
	github: ApiWebhooksWebhookTokenGitHub;
}

/**
 * @endpoint /webhooks/{webhook.id}/{webhook.token}/slack
 */
interface ApiWebhooksWebhookTokenSlack {
	/**
	 * Sends a message with the Slack format.
	 * @url https://discord.com/developers/docs/resources/webhook#execute-slackcompatible-webhook
	 */
	post: ApiMethods['post'];
}

/**
 * @endpoint /webhooks/{webhook.id}/{webhook.token}/github
 */
interface ApiWebhooksWebhookTokenGitHub {
	/**
	 * Sends a message with the GitHub format.
	 * @url https://discord.com/developers/docs/resources/webhook#execute-githubcompatible-webhook
	 */
	post: ApiMethods['post'];
}

interface ApiMethods {
	// eslint-disable-next-line @typescript-eslint/ban-types
	get<T extends unknown>(data?: { query?: {} }): Promise<T>;
	post<T extends unknown>(data: unknown): Promise<T>;
	put<T extends unknown>(data?: unknown): Promise<T>;
	patch<T extends unknown>(data: unknown): Promise<T>;
	delete<T extends unknown>(data?: { reason?: string }): Promise<T>;
}

type R<T> = Exclude<keyof T, keyof ApiMethods>;
