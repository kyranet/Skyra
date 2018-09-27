/**
 * @license
 * MIT License
 *
 * Copyright (c) 2017-2018 dirigeants
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { Command } = require('../../../index');
const { join } = require('path');
const writeSnapshot = require('util')
	.promisify(require('heapdump').writeSnapshot);

export default class extends Command {

	public constructor(client: Skyra, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			permissionLevel: 10,
			guarded: true,
			description: 'Creates a heapdump for finding memory leaks.',
			extendedHelp: [
				'The heapsnapshot command is very useful for bots that have memory issues, it uses the heapdump library',
				'which freezes the entire process for a moment to analize all elements from the process\' HEAP, NEVER share',
				'heapsnapshot files with anybody, as everything your bot holds is included in that file.\n\nTo open heapsnapshot',
				'files, open Google Chrome, open Developer Tools, go to the tab Memory, and in Profiles, click on the buttom "load".',
				'Finally, open the profile and you will be given a table of all objects in your process, have fun!\n\nP.S:',
				'heapsnapshot files are as big as the amount of RAM you use, in big bots, the snapshots can freeze the bot',
				'much longer and the files can be much heavier.'
			].join(' ')
		});
	}

	public async run(msg: SkyraMessage) {
		await msg.sendMessage('Capturing HEAP Snapshot. This may take a while...');

		// Capture the snapshot (this freezes the entire VM)
		const path = join(process.cwd(), `${Date.now()}.heapsnapshot`);
		await writeSnapshot(path);

		return msg.sendMessage(`Captured in \`${path}\`, check! Remember, do NOT share this with anybody, it may contain a lot of sensitive data.`);
	}

}
