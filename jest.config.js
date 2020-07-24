module.exports = {
	coverageProvider: 'v8',
	displayName: 'unit test',
	preset: 'ts-jest',
	testEnvironment: 'node',
	testRunner: 'jest-circus/runner',
	testMatch: ['<rootDir>/tests/**/*.test.ts'],
	moduleNameMapper: {
		'^@orm/(.*)$': '<rootDir>/src/lib/orm/$1',
		'^@utils/(.*)$': '<rootDir>/src/lib/util/$1',
		'^@lib/(.*)$': '<rootDir>/src/lib/$1',
		'^@root/(.*)$': '<rootDir>/src/$1',
		'^@mocks/(.*)$': '<rootDir>/tests/mocks/$1'
	},
	setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
	globals: {
		'ts-jest': {
			tsConfig: '<rootDir>/tests/tsconfig.json'
		}
	},
	coveragePathIgnorePatterns: [
		'<rootDir>/src/arguments',
		'<rootDir>/src/commands',
		'<rootDir>/src/events',
		'<rootDir>/src/extendables',
		'<rootDir>/src/finalizers',
		'<rootDir>/src/inhibitors',
		'<rootDir>/src/ipcMonitors',
		'<rootDir>/src/languages',
		'<rootDir>/src/middlewares',
		'<rootDir>/src/monitors',
		'<rootDir>/src/providers',
		'<rootDir>/src/routes',
		'<rootDir>/src/serializers',
		'<rootDir>/src/tasks',
		'<rootDir>/src/config.ts',
		'<rootDir>/src/config.example.ts',
		'<rootDir>/src/Skyra.ts',
		'<rootDir>/tests/testutils.ts',
		'<rootDir>/src/lib/structures',
		'<rootDir>/src/lib/util/Models'
	]
};
