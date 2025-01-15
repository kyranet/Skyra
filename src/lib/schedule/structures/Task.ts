import { ResponseType, type PartialResponseValue } from '#lib/schedule/manager/ScheduleEntry';
import { Piece } from '@sapphire/framework';
import type { Awaitable } from '@sapphire/utilities';

export abstract class Task extends Piece {
	/**
	 * The run method to be overwritten in actual Task pieces
	 * @param data The data
	 */
	public abstract run(data: unknown): Awaitable<PartialResponseValue | null>;

	protected ignore() {
		return { type: ResponseType.Ignore } as const satisfies PartialResponseValue;
	}

	protected finish() {
		return { type: ResponseType.Finished } as const satisfies PartialResponseValue;
	}

	protected delay(value: number) {
		return { type: ResponseType.Delay, value } as const satisfies PartialResponseValue;
	}

	protected update(value: Date) {
		return { type: ResponseType.Update, value } as const satisfies PartialResponseValue;
	}
}

export namespace Task {
	export type Options = Piece.Options;
}
