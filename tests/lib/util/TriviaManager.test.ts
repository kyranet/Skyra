import nock = require('nock');
import TriviaManager, { QuestionDifficulty, QuestionType } from '@utils/Games/TriviaManager';

describe('TriviaManager', () => {
	// eslint-disable-next-line @typescript-eslint/init-declarations
	let nockScope: nock.Scope;

	beforeEach(() => {
		nockScope = nock('https://opentdb.com')
			.persist()
			.get('/api.php')
			.query({ amount: '1', category: '9', difficulty: 'easy', type: 'boolean' })
			.reply(200, {
				response_code: 0,
				results: [{
					category: 'General Knowledge',
					type: 'boolean',
					difficulty: 'easy',
					question: 'You can legally drink alcohol while driving in Mississippi.',
					correct_answer: 'True',
					incorrect_answers: ['False']
				}]
			});
	});

	afterAll(() => {
		nockScope.persist(false);
		nock.restore();
	});

	test('getQuestion', async () => {
		const data = await TriviaManager.getQuestion(9, QuestionDifficulty.EASY, QuestionType.BOOLEAN);
		expect(data.category).toBe('General Knowledge');
		expect(data.difficulty).toBe(QuestionDifficulty.EASY);
		expect(data.type).toBe(QuestionType.BOOLEAN);
		expect(data.question).toBe('You can legally drink alcohol while driving in Mississippi.');
		expect(data.correct_answer).toBe('True');
		expect(data.incorrect_answers).toStrictEqual(['False']);
	});
});
