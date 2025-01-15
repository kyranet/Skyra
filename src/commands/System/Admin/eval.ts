import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { PermissionLevels } from '#lib/types';
import { clean } from '#utils/Sanitizer/clean';
import { createReferPromise, seconds } from '#utils/common';
import { ZeroWidthSpace } from '#utils/constants';
import { cast } from '#utils/util';
import { bold } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { send } from '@sapphire/plugin-editable-commands';
import { Stopwatch } from '@sapphire/stopwatch';
import { codeBlock, isThenable } from '@sapphire/utilities';
import type { Message } from 'discord.js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { Script, createContext } from 'node:vm';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['ev'],
	description: LanguageKeys.Commands.System.EvalDescription,
	detailedDescription: LanguageKeys.Commands.System.EvalExtended,
	flags: ['async', 'no-timeout', 'json', 'silent', 'showHidden', 'hidden', 'sql'],
	options: ['timeout', 'wait', 'lang', 'language', 'depth'],
	permissionLevel: PermissionLevels.BotOwner,
	quotes: []
})
export class UserCommand extends SkyraCommand {
	private readonly kTimeout = 60000;
	#cachedEvalContext: object | null = null;

	public override async messageRun(message: Message, args: SkyraCommand.Args) {
		const code = await args.rest('string');

		const wait = args.getOption('timeout', 'wait');
		const flagTime = args.getFlags('no-timeout') ? Infinity : wait === null ? this.kTimeout : Number(wait);
		const executeSql = args.getFlags('sql');
		const language = args.getOption('lang', 'language') ?? (executeSql || args.getFlags('json') ? 'json' : 'js');
		const { success, result, time } = executeSql ? await this.sql(code) : await this.eval(message, args, code, flagTime);

		if (args.getFlags('silent')) {
			if (!success && result && cast<Error>(result).stack) this.container.logger.fatal(cast<Error>(result).stack);
			return null;
		}

		const body = codeBlock(language, result || ZeroWidthSpace);
		const header = `${bold(success ? 'Output' : 'Error')}: ${time}`;
		// If the sum of the length between the header and the body exceed 2000 characters, send as file:
		if ([...header, ...body].length > 2000) {
			const file = { attachment: Buffer.from(result, 'utf8'), name: `output.${language}` } as const;
			return send(message, { content: header, files: [file] });
		}

		// Otherwise send as a single message:
		return send(message, `${header}${body}`);
	}

	private async fetchContext() {
		if (!this.#cachedEvalContext) {
			this.#cachedEvalContext = {
				...globalThis,
				buffer: await import('node:buffer'),
				crypto: await import('node:crypto'),
				events: await import('node:events'),
				fs: await import('node:fs'),
				http: await import('node:http'),
				os: await import('node:os'),
				module: await import('node:module'),
				path: await import('node:path'),
				process: await import('node:process'),
				url: await import('node:url'),
				util: await import('node:util'),
				v8: await import('node:v8'),
				vm: await import('node:vm'),
				worker_threads: await import('node:worker_threads'),
				stream: { web: await import('node:stream/web'), ...(await import('node:stream')) },
				timers: { promises: await import('node:timers/promises'), ...(await import('node:timers')) },
				discord: {
					...(await import('discord.js')),
					builders: await import('@discordjs/builders'),
					collection: await import('@discordjs/collection'),
					types: await import('discord-api-types/v10')
				},
				sapphire: {
					asyncQueue: await import('@sapphire/async-queue'),
					fetch: await import('@sapphire/fetch'),
					pieces: await import('@sapphire/pieces'),
					framework: await import('@sapphire/framework'),
					snowflake: await import('@sapphire/snowflake'),
					stopwatch: await import('@sapphire/stopwatch'),
					utilities: {
						...(await import('@sapphire/utilities')),
						time: await import('@sapphire/time-utilities'),
						discord: await import('@sapphire/discord.js-utilities')
					}
				},
				skyra: {
					utils: {
						common: await import('#utils/common'),
						functions: await import('#utils/functions'),
						resolvers: await import('#utils/resolvers')
					},
					database: {
						...(await import('#lib/database')),
						settings: await import('#lib/database/settings')
					},
					moderation: {
						...(await import('#lib/moderation')),
						actions: await import('#lib/moderation/actions'),
						common: await import('#lib/moderation/common'),
						managers: {
							...(await import('#lib/moderation/managers')),
							loggers: await import('#lib/moderation/managers/loggers')
						},
						workers: await import('#lib/moderation/workers')
					},
					structures: {
						...(await import('#lib/structures')),
						data: await import('#lib/structures/data')
					}
				},
				container: this.container,
				client: this.container.client,
				command: this,
				require: createRequire(import.meta.url),
				__filename: fileURLToPath(import.meta.url),
				__dirname: fileURLToPath(new URL('.', import.meta.url))
			};
		}

		return this.#cachedEvalContext;
	}

	private async eval(message: Message, args: SkyraCommand.Args, code: string, timeout: number): Promise<EvalResult> {
		if (timeout === Infinity || timeout === 0) return this.runEval(message, args, code, null, undefined);

		const controller = new AbortController();
		const sleepPromise = createReferPromise<EvalResult>();
		const timer = setTimeout(() => {
			controller.abort();
			sleepPromise.resolve({
				success: false,
				time: '⏱ ...',
				result: args.t(LanguageKeys.Commands.System.EvalTimeout, { seconds: seconds.fromMilliseconds(timeout) })
			});
		}, timeout);
		return Promise.race([this.runEval(message, args, code, controller.signal, timeout).finally(() => clearTimeout(timer)), sleepPromise.promise]);
	}

	private async runEval(
		message: Message,
		args: SkyraCommand.Args,
		code: string,
		signal: AbortSignal | null,
		timeout: number | undefined
	): Promise<EvalResult> {
		if (args.getFlags('async')) code = `(async () => {\n${code}\n})();`;

		let script: Script;
		try {
			script = new Script(code, { filename: 'eval' });
		} catch (error) {
			return { success: false, time: '💥 Syntax Error', result: (error as SyntaxError).message };
		}

		const context = createContext({ ...(await this.fetchContext()), msg: message, message, args, signal });

		const stopwatch = new Stopwatch();
		let success: boolean;
		let syncTime = '';
		let asyncTime = '';
		let result: unknown;
		let thenable = false;

		try {
			result = script.runInNewContext(context, { timeout, microtaskMode: 'afterEvaluate' });

			// If the signal aborted, it should not continue processing the result:
			if (signal?.aborted) return { success: false, time: '⏱ ...', result: 'AbortError' };

			syncTime = stopwatch.toString();
			if (isThenable(result)) {
				thenable = true;
				stopwatch.restart();
				result = await result;
				asyncTime = stopwatch.toString();
			}
			success = true;
		} catch (error) {
			if (!syncTime.length) syncTime = stopwatch.toString();
			if (thenable && !asyncTime.length) asyncTime = stopwatch.toString();
			result = error;
			success = false;
		}

		// If the signal aborted, it should not continue processing the result:
		if (signal?.aborted) return { success: false, time: '⏱ ...', result: 'AbortError' };

		stopwatch.stop();
		if (typeof result !== 'string') {
			result =
				result instanceof Error
					? result.stack
					: args.getFlags('json')
						? JSON.stringify(result, null, 4)
						: inspect(result, {
								depth: Number(args.getOption('depth') ?? 0) || 0,
								showHidden: args.getFlags('showHidden', 'hidden')
							});
		}
		return {
			success,
			time: this.formatTime(syncTime, asyncTime ?? ''),
			result: clean(result as string)
		};
	}

	private async sql(sql: string) {
		const stopwatch = new Stopwatch();
		let success: boolean;
		let time: string;
		let result: unknown;

		try {
			result = await this.container.prisma.$queryRawUnsafe(sql);
			time = stopwatch.toString();
			success = true;
		} catch (error) {
			time = stopwatch.toString();
			result = error;
			success = false;
		}

		stopwatch.stop();

		return {
			success,
			time: this.formatTime(time),
			result: JSON.stringify(result, null, 2)
		};
	}

	private formatTime(syncTime: string, asyncTime?: string) {
		return asyncTime ? `⏱ ${asyncTime}<${syncTime}>` : `⏱ ${syncTime}`;
	}
}

interface EvalResult {
	success: boolean;
	time: string;
	result: string;
}
