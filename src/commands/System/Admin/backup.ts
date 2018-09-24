const { Command } = require('klasa');

module.exports = class extends Command {

	public constructor(client, store, file, directory) {
		super(client, store, file, directory, {
			description: (language) => language.get('COMMAND_BACKUP_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_BACKUP_EXTENDED'),
			guarded: true,
			permissionLevel: 10
		});
	}

	public async run(msg) {
		// Disable this command so it cannot
		// run twice during a backup
		this.disable();
		const message = await msg.sendMessage('Initializing backup... Please hold on.');
		const task = this.client.tasks.get('backup');

		// Do NOT run the task if it's disabled
		if (task.enabled) {
			await task.run({});
			await message.edit('Successfully backed up all data.');
		}
		this.enable();

		// Delete the message sent later and return it
		message.nuke(10000);
		return message;
	}

};
