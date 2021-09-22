import { FT, T } from '#lib/types';

export const Time = T<string>('giveaway:time');
export const TimeTooLong = T<string>('giveaway:timeTooLong');
export const EndsAt = T<string>('giveaway:endsAt');
export const Duration = FT<{ time: number }, string>('giveaway:duration');
export const Title = T<string>('giveaway:title');
export const TitleWithMentions = FT<{ roles: string[] }, string>('giveaway:titleWithMentions');
export const LastChance = FT<{ time: number }, string>('giveaway:lastchance');
export const LastChanceTitle = T<string>('giveaway:lastchanceTitle');
export const LastChanceTitleWithMentions = T<string>('giveaway:lastchanceTitleWithMentions');
export const Ended = FT<{ winners: string; count: number }, string>('giveaway:ended');
export const EndedNoWinner = T<string>('giveaway:endedNoWinner');
export const EndedAt = T<string>('giveaway:endedAt');
export const EndedTitle = T<string>('giveaway:endedTitle');
export const EndedMessage = FT<{ winners: readonly string[]; title: string }, string>('giveaway:endedMessage');
export const EndedMessageNoWinner = FT<{ title: string }, string>('giveaway:endedMessageNoWinner');
export const Scheduled = FT<{ scheduledTime: number }, string>('giveaway:scheduled');
