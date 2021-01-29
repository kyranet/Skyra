import { err, UserError } from '@sapphire/framework';
import { SubCommandEntry } from './SubCommandEntry';
import { SubCommandEntryCommand } from './SubCommandEntryCommand';
import { SubCommandEntryMethod } from './SubCommandEntryMethod';

export class SubCommandManager {
	private readonly entries: SubCommandEntry[] = [];
	private readonly default: SubCommandEntry | null = null;

	public constructor(entries: readonly SubCommandManager.Entry[]) {
		for (const data of entries) {
			const Ctor = SubCommandManager.handlers.get(data.type);
			if (!Ctor) throw new ReferenceError(`There is no sub command handler named '${data.type}' in 'SubCommandManager.handlers'.`);

			const entry = new Ctor(data);
			if (data.default) {
				if (this.default) throw new Error(`There was already a default of '${this.default.input}', cannot add '${data.input}'.`);
				this.default = entry;
			}

			this.entries.push(entry);
		}
	}

	public run(context: SubCommandEntry.RunContext) {
		// Pick one argument, then try to match a subcommand:
		context.args.save();
		const value = context.args.nextMaybe();

		if (value.exists) {
			for (const entry of this.entries) {
				if (entry.match(value.value)) return entry.run(context);
			}
		}

		// No subcommand matched, let's restore and try to run default, if any:
		context.args.restore();
		if (this.default) return this.default.run(context);

		// No match and no subcommand, return an err:
		return err(new UserError({ identifier: 'SubCommandNoMatch', context }));
	}

	public static readonly handlers = new Map([
		['command', SubCommandEntryCommand],
		['method', SubCommandEntryMethod]
	]);
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SubCommandManager {
	export type Type = 'command' | 'method';
	export interface Entry extends SubCommandEntry.Options {
		type: Type;
		default?: boolean;
	}
}
