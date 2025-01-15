import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: [
			{
				find: '#lib',
				replacement: '#lib',
				customResolver(source) {
					if (source === '#lib/database') return resolve('src/lib/database/index.ts');
					if (source === '#lib/database/entities') return resolve('src/lib/database/entities/index.ts');
					if (source === '#lib/database/keys') return resolve('src/lib/database/keys/index.ts');
					if (source === '#lib/database/settings') return resolve('src/lib/database/settings/index.ts');
					if (source === '#lib/discord') return resolve('src/lib/discord/index.ts');
					if (source === '#lib/moderation') return resolve('src/lib/moderation/index.ts');
					if (source === '#lib/moderation/managers') return resolve('src/lib/moderation/managers/index.ts');
					if (source === '#lib/moderation/workers') return resolve('src/lib/moderation/workers/index.ts');
					if (source === '#lib/structures') return resolve('src/lib/structures/index.ts');
					if (source === '#lib/structures/managers') return resolve('src/lib/structures/managers/index.ts');
					if (source === '#lib/setup') return resolve('src/lib/setup/index.ts');
					if (source === '#lib/types') return resolve('src/lib/types/index.ts');
					if (source === '#lib/i18n/languageKeys') return resolve('src/lib/i18n/languageKeys/index.ts');
					return source.replace('#lib', resolve('src/lib'));
				}
			},
			{ find: /^#root\/(.*)/, replacement: resolve('src/$1.ts') },
			{ find: '#languages', replacement: resolve('src/languages/index.ts') },
			{
				find: '#utils',
				replacement: '#utils',
				customResolver(source) {
					if (source === '#utils/common') return resolve('src/lib/util/common/index.ts');
					if (source === '#utils/functions') return resolve('src/lib/util/functions/index.ts');
					return source.replace('#utils', resolve('src/lib/util'));
				}
			}
		]
	},
	test: {
		setupFiles: ['./tests/vitest.setup.ts'],
		globals: true,
		coverage: {
			reporter: ['text', 'lcov', 'cobertura'],
			include: ['src/lib/**'],
			exclude: [
				'src/lib/api',
				'src/lib/database/index.ts',
				'src/lib/database/settings',
				'src/lib/database/utils',
				'src/lib/discord',
				'src/lib/games/base',
				'src/lib/games/connect-four',
				'src/lib/games/HungerGamesUsage.ts',
				'src/lib/games/Slotmachine.ts',
				'src/lib/games/tic-tac-toe',
				'src/lib/moderation',
				'src/lib/SkyraClient.ts',
				'src/lib/structures',
				'src/lib/types',
				'src/lib/util/External',
				'src/lib/util/Links',
				'src/lib/util/LongLivingReactionCollector.ts',
				'src/lib/util/Parsers'
			]
		}
	},
	esbuild: {
		target: 'es2022'
	}
});
