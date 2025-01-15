import { FT, T } from '#lib/types';
import type { ChannelMention, RoleMention } from 'discord.js';

// Root
export const Name = T('commands/lockdown:name');
export const Description = T('commands/lockdown:description');

// Options
export const Action = 'commands/lockdown:action';
export const Channel = 'commands/lockdown:channel';
export const Duration = 'commands/lockdown:duration';
export const Role = 'commands/lockdown:role';
export const Global = 'commands/lockdown:global';

// Action choices
export const ActionLock = T('commands/lockdown:actionLock');
export const ActionUnlock = T('commands/lockdown:actionUnlock');

export const AuditLogLockRequestedBy = FT<{ user: string }>('commands/lockdown:auditLogLockRequestedBy');
export const AuditLogUnlockRequestedBy = FT<{ user: string }>('commands/lockdown:auditLogUnlockRequestedBy');

// Guild
export const GuildLocked = FT<{ role: RoleMention }>('commands/lockdown:guildLocked');
export const GuildUnlocked = FT<{ role: RoleMention }>('commands/lockdown:guildUnlocked');
export const SuccessGuild = FT<{ role: RoleMention }>('commands/lockdown:successGuild');
export const GuildUnknownRole = FT<{ role: RoleMention }>('commands/lockdown:guildUnknownRole');
export const GuildLockFailed = FT<{ role: RoleMention }>('commands/lockdown:guildLockFailed');
export const GuildUnlockFailed = FT<{ role: RoleMention }>('commands/lockdown:guildUnlockFailed');

// Thread
export const SuccessThread = FT<{ channel: ChannelMention }>('commands/lockdown:successThread');
export const ThreadLocked = FT<{ channel: ChannelMention }>('commands/lockdown:threadLocked');
export const ThreadUnlocked = FT<{ channel: ChannelMention }>('commands/lockdown:threadUnlocked');
export const ThreadUnmanageable = FT<{ channel: ChannelMention }>('commands/lockdown:threadUnmanageable');
export const ThreadUnknownChannel = FT<{ channel: ChannelMention }>('commands/lockdown:threadUnknownChannel');
export const ThreadLockFailed = FT<{ channel: ChannelMention }>('commands/lockdown:threadLockFailed');
export const ThreadUnlockFailed = FT<{ channel: ChannelMention }>('commands/lockdown:threadUnlockFailed');

// Channel
export const SuccessChannel = FT<{ channel: ChannelMention }>('commands/lockdown:successChannel');
export const ChannelLocked = FT<{ channel: ChannelMention }>('commands/lockdown:channelLocked');
export const ChannelUnlocked = FT<{ channel: ChannelMention }>('commands/lockdown:channelUnlocked');
export const ChannelUnmanageable = FT<{ channel: ChannelMention }>('commands/lockdown:channelUnmanageable');
export const ChannelUnknownChannel = FT<{ channel: ChannelMention }>('commands/lockdown:channelUnknownChannel');
export const ChannelLockFailed = FT<{ channel: ChannelMention }>('commands/lockdown:channelLockFailed');
