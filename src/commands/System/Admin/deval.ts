const { Command, Stopwatch, klasaUtil: { codeBlock } } = require('../../../index');

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			aliases: ['d-ev', 'dashboard-eval'],
			description: (language) => language.get('COMMAND_EVAL_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_EVAL_EXTENDED'),
			guarded: true,
			permissionLevel: 10,
			usage: '<expression:str>'
		});
	}

	public async run(msg, [code]) {
		if (msg.flags.async) code = `(async () => {\n${code}\n})();`;
		let result, success, time;

		const stopwatch = new Stopwatch();
		try {
			({ message: result } = await this.client.ipc.sendTo('skyra-dashboard', { route: 'eval', payload: code }));
			time = stopwatch.toString();
			success = true;
		} catch (error) {
			time = stopwatch.toString();
			result = error.error || error;
			success = false;
		}

		return msg.send(`⏱ ${time} | **${success ? 'Output' : 'Error'}**${codeBlock('js', result)}`);
	}

}
