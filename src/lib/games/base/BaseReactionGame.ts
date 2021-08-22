import { LanguageKeys } from '#lib/i18n/languageKeys';
import { Events } from '#lib/types/Enums';
import { addReaction } from '#utils/functions';
import { LongLivingReactionCollector } from '#utils/LongLivingReactionCollector';
import { sendLoadingMessage } from '#utils/util';
import { send } from '@skyra/editable-commands';
import type { Message } from 'discord.js';
import type { BaseController } from './BaseController';
import { BaseGame } from './BaseGame';

export abstract class BaseReactionGame<T> extends BaseGame<T> {
	public readonly reactions: readonly string[];
	public readonly listener: LongLivingReactionCollector;
	public readonly reactionTime: number;

	public constructor(
		message: Message,
		playerA: BaseController<T>,
		playerB: BaseController<T>,
		reactions: readonly string[],
		reactionTime: number,
		turn = BaseGame.getTurn()
	) {
		super(message, playerA, playerB, turn);
		this.reactions = reactions;
		this.reactionTime = reactionTime;
		this.listener = new LongLivingReactionCollector();
	}

	protected async onStart(): Promise<unknown> {
		try {
			this.message = await sendLoadingMessage(this.message, this.t);
			for (const reaction of this.reactions) await addReaction(this.message, reaction);
		} catch {
			await send(this.message, this.t(LanguageKeys.Misc.UnexpectedIssue)).catch((error) => this.client.emit(Events.Error, error));
		}

		return super.onStart();
	}

	protected get finished(): boolean {
		return this.listener.ended;
	}

	protected onEnd(): Promise<unknown> {
		this.listener.end();
		return super.onEnd();
	}
}
