import * as utilConstants from '#utils/constants';

describe('Util Constants', () => {
	describe('helpUsagePostProcessor', () => {
		test('GIVEN value matching key THEN returns empty string', () => {
			expect(utilConstants.helpUsagePostProcessor.process('yarnExtended.extendedHelp', ['yarnExtended.extendedHelp'], {}, '')).toEqual('');
		});

		test('GIVEN value not matching key THEN returns value', () => {
			expect(utilConstants.helpUsagePostProcessor.process('This is so much help', ['yarnExtended.extendedHelp'], {}, '')).toEqual(
				'This is so much help'
			);
		});

		test('GIVEN check on name THEN returns helpUsagePostProcessor', () => {
			expect(utilConstants.helpUsagePostProcessor.name).toEqual('helpUsagePostProcessor');
		});

		test('GIVEN check on type THEN returns postProcessor', () => {
			expect(utilConstants.helpUsagePostProcessor.type).toEqual('postProcessor');
		});
	});
});
