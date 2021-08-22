import { container } from '@sapphire/framework';
import type { GuildResolvable } from 'discord.js';
import type { GuildEntity } from '../entities/GuildEntity';
import type { SettingsCollectionCallback } from './base/SettingsCollection';

type K = keyof V;
type V = GuildEntity;

export function readSettings<K1 extends K>(guild: GuildResolvable, paths: readonly [K1]): Promise<[V[K1]]>;
export function readSettings<K1 extends K, K2 extends K>(guild: GuildResolvable, paths: readonly [K1, K2]): Promise<[V[K1], V[K2]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3]
): Promise<[V[K1], V[K2], V[K3]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4]
): Promise<[V[K1], V[K2], V[K3], V[K4]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4, K5]
): Promise<[V[K1], V[K2], V[K3], V[K4], V[K5]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4, K5, K6]
): Promise<[V[K1], V[K2], V[K3], V[K4], V[K5], V[K6]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K, K7 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4, K5, K6, K7]
): Promise<[V[K1], V[K2], V[K3], V[K4], V[K5], V[K6], V[K7]]>;
export function readSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K, K7 extends K, K8 extends K>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4, K5, K6, K7, K8]
): Promise<[V[K1], V[K2], V[K3], V[K4], V[K5], V[K6], V[K7], V[K8]]>;
export function readSettings<
	K1 extends K,
	K2 extends K,
	K3 extends K,
	K4 extends K,
	K5 extends K,
	K6 extends K,
	K7 extends K,
	K8 extends K,
	K9 extends K
>(
	guild: GuildResolvable,
	paths: readonly [K1, K2, K3, K4, K5, K6, K7, K8, K9]
): Promise<[V[K1], V[K2], V[K3], V[K4], V[K5], V[K6], V[K7], V[K8], V[K9]]>;
export function readSettings<KX extends K>(guild: GuildResolvable, paths: readonly KX[]): Promise<V[KX][]>;
export function readSettings<K1 extends K>(guild: GuildResolvable, path: K1): Promise<V[K1]>;
export function readSettings<R>(guild: GuildResolvable, cb: SettingsCollectionCallback<V, R>): Promise<R>;
export function readSettings(guild: GuildResolvable): Promise<V>;
export function readSettings(guild: GuildResolvable, paths?: any) {
	const resolved = container.client.guilds.resolveId(guild);
	if (resolved === null) throw new TypeError(`Cannot resolve "guild" to a Guild instance.`);
	return container.settings.guilds.read(resolved, paths);
}

export function writeSettings<K1 extends K>(guild: GuildResolvable, pairs: readonly [[K1, V[K1]]]): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K>(guild: GuildResolvable, pairs: readonly [[K1, V[K1]], [K2, V[K2]]]): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]]]
): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]]]
): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]], [K5, V[K5]]]
): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]], [K5, V[K5]], [K6, V[K6]]]
): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K, K7 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]], [K5, V[K5]], [K6, V[K6]], [K7, V[K7]]]
): Promise<void>;
export function writeSettings<K1 extends K, K2 extends K, K3 extends K, K4 extends K, K5 extends K, K6 extends K, K7 extends K, K8 extends K>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]], [K5, V[K5]], [K6, V[K6]], [K7, V[K7]], [K8, V[K8]]]
): Promise<void>;
export function writeSettings<
	K1 extends K,
	K2 extends K,
	K3 extends K,
	K4 extends K,
	K5 extends K,
	K6 extends K,
	K7 extends K,
	K8 extends K,
	K9 extends K
>(
	guild: GuildResolvable,
	pairs: readonly [[K1, V[K1]], [K2, V[K2]], [K3, V[K3]], [K4, V[K4]], [K5, V[K5]], [K6, V[K6]], [K7, V[K7]], [K8, V[K8]], [K9, V[K9]]]
): Promise<void>;
export function writeSettings<KX extends K>(guild: GuildResolvable, pairs: readonly [KX, V[KX]][]): Promise<void>;
export function writeSettings<R>(guild: GuildResolvable, cb: SettingsCollectionCallback<V, R>): Promise<R>;
export function writeSettings(guild: GuildResolvable, paths: any) {
	const resolved = container.client.guilds.resolveId(guild);
	if (resolved === null) throw new TypeError(`Cannot resolve "guild" to a Guild instance.`);
	return container.settings.guilds.write(resolved, paths);
}
