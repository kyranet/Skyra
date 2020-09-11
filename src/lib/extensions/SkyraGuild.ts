/* eslint-disable @typescript-eslint/no-invalid-this */
import { ModerationManager } from '@lib/structures/managers/ModerationManager';
import { PermissionsManager } from '@lib/structures/managers/PermissionsManager';
import { StarboardManager } from '@lib/structures/managers/StarboardManager';
import { StickyRoleManager } from '@lib/structures/managers/StickyRoleManager';
import { MusicHandler } from '@lib/structures/music/MusicHandler';
import { WSGuildCreate } from '@lib/types/DiscordAPI';
import { GuildSecurity } from '@utils/Security/GuildSecurity';
import { Structures } from 'discord.js';

export class SkyraGuild extends Structures.get('Guild') {
	public readonly security: GuildSecurity = new GuildSecurity(this);
	public readonly starboard: StarboardManager = new StarboardManager(this);
	public readonly moderation: ModerationManager = new ModerationManager(this);
	public readonly permissionsManager: PermissionsManager = new PermissionsManager(this);
	public readonly music: MusicHandler = new MusicHandler(this);
	public readonly stickyRoles: StickyRoleManager = new StickyRoleManager(this);
}

declare module 'discord.js' {
	export interface Guild {
		readonly security: GuildSecurity;
		readonly starboard: StarboardManager;
		readonly moderation: ModerationManager;
		readonly permissionsManager: PermissionsManager;
		readonly music: MusicHandler;
		readonly stickyRoles: StickyRoleManager;

		_patch(data: WSGuildCreate & { shardID: number }): void;
	}
}

Structures.extend('Guild', () => SkyraGuild);
