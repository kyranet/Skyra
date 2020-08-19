/* eslint-disable @typescript-eslint/no-invalid-this */
import { codeBlock, toTitleCase } from '@klasa/utils';
import { Filter, Position } from '@lib/types/Languages';
import { NotificationsStreamsTwitchEventStatus } from '@lib/types/settings/GuildSettings';
import ShinyWager from '@root/arguments/shinywager';
import { CLIENT_ID, VERSION } from '@root/config';
import { Emojis } from '@utils/constants';
import friendlyDuration, { DurationFormatAssetsTime, TimeTypes } from '@utils/FriendlyDuration';
import { HungerGamesUsage } from '@utils/Games/HungerGamesUsage';
import { CATEGORIES } from '@utils/Games/TriviaManager';
import { createPick, inlineCodeblock } from '@utils/util';
import { Language, LanguageKeys, Timestamp, version as klasaVersion } from 'klasa';

const LOADING = Emojis.Loading;
const SHINY = Emojis.Shiny;
const GREENTICK = Emojis.GreenTick;
const REDCROSS = Emojis.RedCross;

const timestamp = new Timestamp('YYYY/MM/DD [at] HH:mm:ss');

const TIMES: DurationFormatAssetsTime = {
	[TimeTypes.Year]: {
		1: 'year',
		DEFAULT: 'years'
	},
	[TimeTypes.Month]: {
		1: 'month',
		DEFAULT: 'months'
	},
	[TimeTypes.Week]: {
		1: 'week',
		DEFAULT: 'weeks'
	},
	[TimeTypes.Day]: {
		1: 'day',
		DEFAULT: 'days'
	},
	[TimeTypes.Hour]: {
		1: 'hour',
		DEFAULT: 'hours'
	},
	[TimeTypes.Minute]: {
		1: 'minute',
		DEFAULT: 'minutes'
	},
	[TimeTypes.Second]: {
		1: 'second',
		DEFAULT: 'seconds'
	}
};

const PERMS = {
	ADMINISTRATOR: 'Administrator',
	VIEW_AUDIT_LOG: 'View Audit Log',
	MANAGE_GUILD: 'Manage Server',
	MANAGE_ROLES: 'Manage Roles',
	MANAGE_CHANNELS: 'Manage Channels',
	KICK_MEMBERS: 'Kick Members',
	BAN_MEMBERS: 'Ban Members',
	CREATE_INSTANT_INVITE: 'Create Instant Invite',
	CHANGE_NICKNAME: 'Change Nickname',
	MANAGE_NICKNAMES: 'Manage Nicknames',
	MANAGE_EMOJIS: 'Manage Emojis',
	MANAGE_WEBHOOKS: 'Manage Webhooks',
	VIEW_CHANNEL: 'Read Messages',
	SEND_MESSAGES: 'Send Messages',
	SEND_TTS_MESSAGES: 'Send TTS Messages',
	MANAGE_MESSAGES: 'Manage Messages',
	EMBED_LINKS: 'Embed Links',
	ATTACH_FILES: 'Attach Files',
	READ_MESSAGE_HISTORY: 'Read Message History',
	MENTION_EVERYONE: 'Mention Everyone',
	USE_EXTERNAL_EMOJIS: 'Use External Emojis',
	ADD_REACTIONS: 'Add Reactions',
	CONNECT: 'Connect',
	SPEAK: 'Speak',
	STREAM: 'Stream',
	MUTE_MEMBERS: 'Mute Members',
	DEAFEN_MEMBERS: 'Deafen Members',
	MOVE_MEMBERS: 'Move Members',
	USE_VAD: 'Use Voice Activity',
	PRIORITY_SPEAKER: 'Priority Speaker'
};

const random = (num: number) => Math.round(Math.random() * num);

function duration(time: number, precision?: number) {
	return friendlyDuration(time, TIMES, precision);
}

/** Parses cardinal numbers to the ordinal counterparts */
function ordinal(cardinal: number) {
	const cent = cardinal % 100;
	const dec = cardinal % 10;

	if (cent >= 10 && cent <= 20) {
		return `${cardinal}th`;
	}

	switch (dec) {
		case 1:
			return `${cardinal}st`;
		case 2:
			return `${cardinal}nd`;
		case 3:
			return `${cardinal}rd`;
		default:
			return `${cardinal}th`;
	}
}

const list = (andValue: string, orString: string) => (values: readonly string[], conjuction: typeof andValue | typeof orString) => {
	switch (values.length) {
		case 0:
			return '';
		case 1:
			return values[0];
		case 2:
			return `${values[0]} ${conjuction} ${values[1]}`;
		default: {
			const trail = values.slice(0, -1);
			const head = values[values.length - 1];
			return `${trail.join(', ')}, ${conjuction} ${head}`;
		}
	}
};

function groupDigits(number: number) {
	return number.toLocaleString('en-US', { useGrouping: true });
}

export default class extends Language {
	public andString = 'and';
	public orString = 'or';
	public PERMISSIONS = PERMS;
	public HUMAN_LEVELS = {
		0: 'None',
		1: 'Low',
		2: 'Medium',
		3: 'High',
		4: 'Highest'
	};

	public duration = duration;
	public ordinal = ordinal;
	public list = list(this.andString, this.orString);
	public groupDigits = groupDigits;

	public language: LanguageKeys = {
		/**
		 * ################################
		 * #      FRAMEWORK MESSAGES      #
		 * #         KLASA 0.5.0d         #
		 * ################################
		 */

		DEFAULT: ({ key }) => `${key} has not been localized for en-US yet.`,
		DEFAULT_LANGUAGE: 'Default Language',
		SETTING_GATEWAY_KEY_NOEXT: ({ key }) => `The key "${key}" does not exist in the data schema.`,
		SETTING_GATEWAY_CHOOSE_KEY: ({ keys }) => `You cannot edit a settings group, pick any of the following: "${keys.join('", "')}"`,
		SETTING_GATEWAY_UNCONFIGURABLE_FOLDER: 'This settings group does not have any configurable sub-key.',
		SETTING_GATEWAY_UNCONFIGURABLE_KEY: ({ key }) => `The settings key "${key}" has been marked as non-configurable by the bot owner.`,
		SETTING_GATEWAY_MISSING_VALUE: ({ entry, value }) =>
			`The value "${value}" cannot be removed from the key "${entry.path}" because it does not exist.`,
		SETTING_GATEWAY_DUPLICATE_VALUE: ({ entry, value }) =>
			`The value "${value}" cannot be added to the key "${entry.path}" because it was already set.`,
		SETTING_GATEWAY_INVALID_FILTERED_VALUE: ({ entry, value }) => `The settings key "${entry.path}" does not accept the value "${value}".`,
		RESOLVER_MULTI_TOO_FEW: ({ name, min = 1 }) => `Provided too few ${name}s. At least ${min} ${min === 1 ? 'is' : 'are'} required.`,
		RESOLVER_INVALID_BOOL: ({ name }) => `${name} must be true or false.`,
		RESOLVER_INVALID_CHANNEL: ({ name }) => `${name} must be a channel tag or valid channel id.`,
		RESOLVER_INVALID_CUSTOM: ({ name, type }) => `${name} must be a valid ${type}.`,
		RESOLVER_INVALID_DATE: ({ name }) => `${name} must be a valid date.`,
		RESOLVER_INVALID_DURATION: ({ name }) => `${name} must be a valid duration string.`,
		RESOLVER_INVALID_EMOJI: ({ name }) => `${name} must be a custom emoji tag or valid emoji id.`,
		RESOLVER_INVALID_FLOAT: ({ name }) => `${name} must be a valid number.`,
		RESOLVER_INVALID_GUILD: ({ name }) => `${name} must be a valid guild id.`,
		RESOLVER_INVALID_INT: ({ name }) => `${name} must be an integer.`,
		RESOLVER_INVALID_INVITE: ({ name }) => `${name} must be a valid invite link.`,
		RESOLVER_INVALID_WAGER: ({ bet }) =>
			`I am sorry, but ${bet} ${SHINY} is an invalid amount to bet. You can bet one of ${ShinyWager.kValidBetAmounts
				.map((amount) => `\`${amount}\``)
				.join(', ')}`,
		RESOLVER_INVALID_LITERAL: ({ name }) => `Your option did not match the only possibility: ${name}`,
		RESOLVER_INVALID_MEMBER: ({ name }) => `${name} must be a mention or valid user id.`,
		RESOLVER_INVALID_MESSAGE: ({ name }) => `${name} must be a valid message id.`,
		RESOLVER_INVALID_PIECE: ({ name, piece }) => `${name} must be a valid ${piece} name.`,
		RESOLVER_INVALID_REGEX_MATCH: ({ name, pattern }) => `${name} must follow this regex pattern \`${pattern}\`.`,
		RESOLVER_INVALID_ROLE: ({ name }) => `${name} must be a role mention or role id.`,
		RESOLVER_INVALID_STRING: ({ name }) => `${name} must be a valid string.`,
		RESOLVER_INVALID_TIME: ({ name }) => `${name} must be a valid duration or date string.`,
		RESOLVER_INVALID_URL: ({ name }) => `${name} must be a valid url.`,
		RESOLVER_INVALID_USER: ({ name }) => `${name} must be a mention or valid user id.`,
		RESOLVER_INVALID_SNOWFLAKE: ({ name }) => `${name} must be a valid Discord snowflake.`,
		RESOLVER_STRING_SUFFIX: ' characters',
		RESOLVER_MINMAX_EXACTLY: ({ name, min }) => `${name} must be exactly ${min}.`,
		RESOLVER_MINMAX_BOTH: ({ name, min, max, inclusive }) =>
			inclusive ? `${name} must be between ${min} and ${max} inclusively.` : `${name} must be between ${min} and ${max} exclusively.`,
		RESOLVER_MINMAX_MIN: ({ name, min, inclusive }) =>
			inclusive ? `${name} must be greater than ${min} inclusively.` : `${name} must be greater than ${min} exclusively.`,
		RESOLVER_MINMAX_MAX: ({ name, max, inclusive }) =>
			inclusive ? `${name} must be less than ${max} inclusively` : `${name} must be less than ${max} exclusively.`,
		REACTIONHANDLER_PROMPT: 'Which page would you like to jump to?',
		// used for help command
		SYSTEM_HELP_TITLES: {
			EXPLAINED_USAGE: '⚙ | ***Explained usage***',
			POSSIBLE_FORMATS: '🔢 | ***Possible formats***',
			EXAMPLES: '🔗 | ***Examples***',
			REMINDERS: '⏰ | ***Reminder***'
		},
		COMMANDMESSAGE_MISSING: 'Missing one or more required arguments after end of input.',
		COMMANDMESSAGE_MISSING_REQUIRED: ({ name }) => `${name} is a required argument.`,
		COMMANDMESSAGE_MISSING_OPTIONALS: ({ possibles }) => `Missing a required option: (${possibles})`,
		COMMANDMESSAGE_NOMATCH: ({ possibles }) => `Your option didn't match any of the possibilities: (${possibles})`,
		MONITOR_COMMAND_HANDLER_REPROMPT: ({ tag, name, time, cancelOptions }) =>
			`${tag} | **${name}** | You have **${time}** seconds to respond to this prompt with a valid argument. Type **${cancelOptions.join(
				'**, **'
			)}** to abort this prompt.`,
		MONITOR_COMMAND_HANDLER_REPEATING_REPROMPT: ({ tag, name, time, cancelOptions }) =>
			`${tag} | **${name}** is a repeating argument | You have **${time}** seconds to respond to this prompt with additional valid arguments. Type **${cancelOptions.join(
				'**, **'
			)}** to cancel this prompt.`,
		MONITOR_COMMAND_HANDLER_ABORTED: 'Aborted',
		INHIBITOR_COOLDOWN: ({ remaining }) => `You have just used this command. You can use this command again in ${duration(remaining)}.`,
		INHIBITOR_MISSING_BOT_PERMS: ({ missing }) => `I don't have sufficient permissions! I'm missing: ${this.list(missing, 'and')}`,
		INHIBITOR_NSFW: 'You may not use NSFW commands in this channel!',
		INHIBITOR_PERMISSIONS: 'You do not have permission to use this command!',
		INHIBITOR_REQUIRED_SETTINGS: ({ settings }) =>
			`The guild is missing the **${settings.join(', ')}** guild setting${settings.length === 1 ? '' : 's'} and thus the command cannot run.`,
		INHIBITOR_RUNIN: ({ type }) => `This command is only available in ${type} channels.`,
		INHIBITOR_RUNIN_NONE: ({ name }) => `The ${name} command is not configured to run in any channel.`,
		INHIBITOR_DISABLED_GUILD: 'This command has been disabled by an admin in this guild!',
		INHIBITOR_DISABLED_GLOBAL: 'This command has been globally disabled by the bot owner!',
		COMMAND_BLACKLIST_DESCRIPTION: 'Blacklists or un-blacklists users and guilds from the bot.',
		COMMAND_BLACKLIST_SUCCESS: ({ usersAdded, usersRemoved, guildsAdded, guildsRemoved }) =>
			[
				usersAdded.length ? `**Users Added**\n${codeBlock('', usersAdded.join(', '))}` : '',
				usersRemoved.length ? `**Users Removed**\n${codeBlock('', usersRemoved.join(', '))}` : '',
				guildsAdded.length ? `**Guilds Added**\n${codeBlock('', guildsAdded.join(', '))}` : '',
				guildsRemoved.length ? `**Guilds Removed**\n${codeBlock('', guildsRemoved.join(', '))}` : ''
			]
				.filter((val) => val !== '')
				.join('\n'),
		COMMAND_UNLOAD: ({ type, name }) => `${GREENTICK} Unloaded ${type}: ${name}`,
		COMMAND_UNLOAD_DESCRIPTION: 'Unloads the klasa piece.',
		COMMAND_TRANSFER_ERROR: `${REDCROSS} That file has been transferred already or never existed.`,
		COMMAND_TRANSFER_SUCCESS: ({ type, name }) => `${GREENTICK} Successfully transferred ${type}: ${name}`,
		COMMAND_TRANSFER_FAILED: ({ type, name }) => `Transfer of ${type}: ${name} to Client has failed. Please check your Console.`,
		COMMAND_TRANSFER_DESCRIPTION: 'Transfers a core piece to its respective folder',
		COMMAND_RELOAD: ({ type, name, time }) => `${GREENTICK} Reloaded ${type}: ${name}. (Took: ${time})`,
		COMMAND_RELOAD_FAILED: ({ type, name }) => `❌ Failed to reload ${type}: ${name}. Please check your Console.`,
		COMMAND_RELOAD_ALL: ({ type, time }) => `${GREENTICK} Reloaded all ${type}. (Took: ${time})`,
		COMMAND_RELOAD_EVERYTHING: ({ time }) => `${GREENTICK} Reloaded everything. (Took: ${time})`,
		COMMAND_RELOAD_DESCRIPTION: 'Reloads a klasa piece, or all pieces of a klasa store.',
		COMMAND_REBOOT: `${LOADING} Rebooting...`,
		COMMAND_REBOOT_DESCRIPTION: 'Reboots the bot.',
		COMMAND_PING: `${LOADING} Ping?`,
		COMMAND_PING_DESCRIPTION: 'Runs a connection test to Discord.',
		COMMAND_PINGPONG: ({ diff, ping }) => `Pong! (Roundtrip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
		COMMAND_INFO_DESCRIPTION: 'Provides some information about this bot.',
		COMMAND_HELP_DESCRIPTION: 'Display help for a command.',
		COMMAND_HELP_NO_EXTENDED: 'No extended help available.',
		COMMAND_HELP_DM: '📥 | The list of commands you have access to has been sent to your DMs.',
		COMMAND_HELP_NODM: `${REDCROSS} | You have DMs disabled, I couldn't send you the commands in DMs.`,
		COMMAND_HELP_ALL_FLAG: ({ prefix }) =>
			`Displaying one category per page. Have issues with the embed? Run \`${prefix}help --all\` for a full list in DMs.`,
		COMMAND_HELP_COMMAND_COUNT: ({ n }) => `${n} command${n === 1 ? '' : 's'}`,
		COMMAND_ENABLE: ({ type, name }) => `+ Successfully enabled ${type}: ${name}`,
		COMMAND_ENABLE_DESCRIPTION: 'Re-enables or temporarily enables a command/inhibitor/monitor/finalizer. Default state restored on reboot.',
		COMMAND_DISABLE: ({ type, name }) => `+ Successfully disabled ${type}: ${name}`,
		COMMAND_DISABLE_DESCRIPTION:
			'Re-disables or temporarily disables a command/inhibitor/monitor/finalizer/event. Default state restored on reboot.',
		COMMAND_DISABLE_WARN: "You probably don't want to disable that, since you wouldn't be able to run any command to enable it again",
		COMMAND_CONF_NOKEY: 'You must provide a key',
		COMMAND_CONF_NOVALUE: 'You must provide a value',
		COMMAND_CONF_GUARDED: ({ name }) => `${toTitleCase(name)} may not be disabled.`,
		COMMAND_CONF_UPDATED: ({ key, response }) => `Successfully updated the key **${key}**: \`${response}\``,
		COMMAND_CONF_KEY_NOT_ARRAY: "This key is not array type. Use the action 'reset' instead.",
		COMMAND_CONF_GET_NOEXT: ({ key }) => `The key **${key}** does not seem to exist.`,
		COMMAND_CONF_GET: ({ key, value }) => `The value for the key **${key}** is: \`${value}\``,
		COMMAND_CONF_RESET: ({ key, value }) => `The key **${key}** has been reset to: \`${value}\``,
		COMMAND_CONF_NOCHANGE: ({ key }) => `The value for **${key}** was already that value.`,
		COMMAND_CONF_SERVER_DESCRIPTION: 'Define per-server settings.',
		COMMAND_CONF_SERVER: ({ key, list }) => `**Server Setting ${key}**\n${list}`,
		COMMAND_CONF_USER_DESCRIPTION: 'Define per-user settings.',
		COMMAND_CONF_USER: ({ key, list }) => `**User Setting ${key}**\n${list}`,
		COMMAND_CONF_SETTING_NOT_SET: 'Not Set',
		MESSAGE_PROMPT_TIMEOUT: 'The prompt has timed out.',
		TEXT_PROMPT_ABORT_OPTIONS: ['abort', 'stop', 'cancel'],
		COMMAND_LOAD: ({ time, type, name }) => `✅ Successfully loaded ${type}: ${name}. (Took: ${time})`,
		COMMAND_LOAD_FAIL: 'The file does not exist, or an error occurred while loading your file. Please check your console.',
		COMMAND_LOAD_ERROR: ({ type, name, error }) => `${REDCROSS} Failed to load ${type}: ${name}. Reason:${codeBlock('js', error)}`,
		COMMAND_LOAD_DESCRIPTION: 'Load a piece from your bot.',

		/**
		 * ################################
		 * #     COMMAND DESCRIPTIONS     #
		 * ################################
		 */

		ARGUMENT_RANGE_INVALID: ({ name }) => `${name} must be a number or a range of numbers.`,
		ARGUMENT_RANGE_MAX: ({ name, maximum }) => `${name} accepts a range of maximum ${maximum} ${maximum === 1 ? 'number' : 'numbers'}`,

		COMMAND_ADD_DESCRIPTION: 'Adds a song the the queue.',
		COMMAND_ADD_EXTENDED: {
			extendedHelp: [
				`Add songs to the playing queue and prepare for musical enjoyment!
					I can play from YouTube, Bandcamp, SoundCloud, Twitch, Vimeo, or Mixer.`,
				'- To play from YouTube either give me something to search, a video link, or a playlist link.',
				'- To play from SoundCloud give me a SoundCloud link, or if you want me to search include either `--sc` or `--soundcloud` in your message.',
				"- To play from Mixer give me the URL of a Mixer streamer, I'm sorry but I cannot (yet) play Mixer VODs.",
				'- To play from Bandcamp, Twitch, or Vimeo just give me a URL to a video or playlist on those sources.'
			].join('\n'),
			explainedUsage: [['song', 'The song to queue. Can be either a URL or a video/song title.']],
			examples: [
				'The Pokémon Theme song',
				'https://youtu.be/fJ9rUzIMcZQ',
				'--sc Imagine Dragons Believer',
				'https://soundcloud.com/vladkurt/imagine-dragons-beliver-vladkurt-remix',
				'https://vimeo.com/channels/music/239029778',
				'https://mixer.com/Ninja',
				'https://thedisappointed.bandcamp.com/album/escapism-2'
			],
			multiline: true
		},
		COMMAND_ADD_PLAYLIST: ({ amount }) => `${GREENTICK} Added **${amount}** ${amount === 1 ? 'song' : 'songs'} to the queue 🎶`,
		COMMAND_ADD_SONG: ({ title }) => `${GREENTICK} Added **${title}** to the queue 🎶`,
		COMMAND_CLEAR_DESCRIPTION: 'Clears the queue list.',
		COMMAND_CLEAR_DENIED: `${REDCROSS} You can't execute this command when there are over 4 members! You must be a dee-jay or a moderator!`,
		COMMAND_CLEAR_SUCCESS: ({ amount }) => `${REDCROSS}  Pruned ${amount} ${amount === 1 ? 'song' : 'songs'}.`,
		COMMAND_JOIN_DESCRIPTION: "Joins the message author's voice channel.",
		COMMAND_JOIN_NO_MEMBER: `${REDCROSS} I am sorry, but Discord did not tell me the information I need, so I do not know what voice channel are you connected to...`,
		COMMAND_JOIN_NO_VOICECHANNEL: `${REDCROSS} You are not connected in a voice channel.`,
		COMMAND_JOIN_SUCCESS: ({ channel }) => `${GREENTICK} Successfully joined the voice channel ${channel}`,
		COMMAND_JOIN_VOICE_DIFFERENT: `${REDCROSS} I think you confused the channels! Earth to Moon, we are in another voice channel!`,
		COMMAND_JOIN_VOICE_FULL: `${REDCROSS} I cannot join your voice channel, it's full... kick somebody or make room for me!`,
		COMMAND_JOIN_VOICE_NO_CONNECT: `${REDCROSS} I do not have enough permissions to connect to your voice channel. I am missing the **${PERMS.CONNECT}** permission.`,
		COMMAND_JOIN_VOICE_NO_SPEAK: `${REDCROSS} I can connect... but not speak. Please turn on this permission so I can emit music.`,
		COMMAND_JOIN_VOICE_SAME: `${REDCROSS} Turn on your volume! I am playing music there!`,
		COMMAND_JOIN_FAILED: `${REDCROSS} I could not join your voice channel because there is something wrong with my music player. Please join the support server by using \`@Skyra support\` and alert my developers.`,
		COMMAND_LEAVE_DESCRIPTION: 'Leaves the voice channel.',
		COMMAND_LEAVE_EXTENDED: {
			extendedHelp: `Use this command to have Skyra leave the current voice channel.
			By default I will leave the channel, forget about the currently playing song, but leave the queue intact.
			This means that once you do \`Skyra, play\` after the leave command, I will continue playing with the first song that was on the queue before I left.

			This default behaviour can be modified with flags:
			\`--removeall\` or \`--ra\` to follow the default behavior as well clear the queue, next time you want me to start playing you will have to build a new queue`,
			examples: ['leave', 'leave --removeall', 'leave --ra', 'leave --soft'],
			multiline: true
		},
		COMMAND_LEAVE_SUCCESS: ({ channel }) => `${GREENTICK} Successfully left the voice channel ${channel}`,
		COMMAND_PAUSE_DESCRIPTION: 'Pauses the current song.',
		COMMAND_PAUSE_SUCCESS: `${GREENTICK} Paused`,
		COMMAND_PLAY_DESCRIPTION: 'Let me be your DJ and play you some tunes!',
		COMMAND_PLAY_EXTENDED: {
			extendedHelp: [
				`Queue some music and allow me to start jamming out to your enjoyment.
				When using this command I will automatically join your voice channel and start playing the first song in my queue.
					I can play from YouTube, Bandcamp, SoundCloud, Twitch, Vimeo, or Mixer.`,
				'- To play from YouTube either give me something to search, a video link, or a playlist link.',
				'- To play from SoundCloud give me a SoundCloud link, or if you want me to search include either `--sc` or `--soundcloud` in your message.',
				"- To play from Mixer give me the URL of a Mixer streamer, I'm sorry but I cannot (yet) play Mixer VOD's.",
				'- To play from Bandcamp, Twitch, or Vimeo just give me a URL to a video or playlist on those sources.'
			].join('\n'),
			explainedUsage: [['song', 'The song to play. Can be either a URL or a video/song title.']],
			examples: [
				'The Pokémon Theme song',
				'https://youtu.be/fJ9rUzIMcZQ',
				'--sc Imagine Dragons Believer',
				'https://soundcloud.com/vladkurt/imagine-dragons-beliver-vladkurt-remix',
				'https://vimeo.com/channels/music/239029778',
				'https://mixer.com/Ninja',
				'https://thedisappointed.bandcamp.com/album/escapism-2'
			],
			reminder: 'Before you can use this command you should join a voice channel!',
			multiline: true
		},
		COMMAND_PLAY_END: 'It looks like the queue ended here. I hope you enjoyed the session!',
		COMMAND_PLAY_NEXT: ({ title, requester }) => `🎧 Playing: **${title}** as requested by: **${requester}**`,
		COMMAND_PLAY_QUEUE_PAUSED: ({ song }) => `There was a track going on! Playing it back! Now playing: ${song}!`,
		COMMAND_PLAY_QUEUE_PLAYING: `${REDCROSS} Hey! The disk is already spinning!`,
		COMMAND_PLAY_QUEUE_EMPTY:
			'The session is over, add some songs to the queue, you can for example do `Skyra, add Imperial March`, and... *dumbrolls*!',
		COMMAND_PLAYING_DESCRIPTION: 'Get information from the current song.',
		COMMAND_PLAYING_DURATION: ({ duration }) => `**Duration**: ${duration}`,
		COMMAND_PLAYING_QUEUE_EMPTY: `${REDCROSS} Are you speaking to me? Because my deck is empty...`,
		COMMAND_PLAYING_QUEUE_NOT_PLAYING: `${REDCROSS} I think you're listening to background noise, I'm not playing anything.`,
		COMMAND_REPEAT_DESCRIPTION: 'Toggle repeating the current song.',
		COMMAND_REPEAT_SUCCESS: ({ enabled }) =>
			enabled
				? "This is your JAM isn't it? Don't you worry, we will repeat this on and on and on!"
				: "I was actually getting tired of this too, but I didn't want to say anything.",
		COMMAND_QUEUE_DESCRIPTION: 'Check the queue list.',
		COMMAND_QUEUE_LAST: 'There are no more songs! After the one playing is over, the session will end!',
		COMMAND_QUEUE_TITLE: ({ guildname }) => `Music queue for ${guildname}`,
		COMMAND_QUEUE_LINE: ({ position, duration, title, url, requester }) =>
			`**[\`${position}\`]** │ \`${duration}\` │ [${title}](${url}) │ Requester: **${requester}**.`,
		COMMAND_QUEUE_NOWPLAYING: ({ duration, title, url, requester, timeRemaining }) =>
			[
				duration ? `\`${duration}\`` : 'Live Stream',
				`[${title}](${url})`,
				`Requester: **${requester}**`,
				timeRemaining ? `🕰 Time remaining: ${timeRemaining}.` : null
			]
				.filter(Boolean)
				.join(' | '),
		COMMAND_QUEUE_NOWPLAYING_TITLE: 'Now Playing:',
		COMMAND_QUEUE_TOTAL_TITLE: 'Total songs:',
		COMMAND_QUEUE_TOTAL: ({ songs, remainingTime }) =>
			`${songs} song${songs === 1 ? '' : 's'} in the queue, with a total duration of ${remainingTime}`,
		COMMAND_QUEUE_EMPTY: "looks like nothing is playing right now and the queue is empty, why don't you start the disc?",
		COMMAND_QUEUE_DASHBOARD_INFO: ({ guild }) =>
			`Did you know that you can also manage your music using a fancy webapp? [Click here to go there](https://skyra.pw/music/${guild.id})`,
		COMMAND_REMOVE_DESCRIPTION: 'Remove a song from the queue list.',
		COMMAND_REMOVE_INDEX_INVALID: `I'm good with maths, unlike my sister, but I need you to give me a number equal or bigger than 1.`,
		COMMAND_REMOVE_INDEX_OUT: ({ amount }) =>
			`maybe time happened too fast for you, there are ${amount} ${amount === 1 ? 'song' : 'songs'} in the queue!`,
		COMMAND_REMOVE_DENIED: `${REDCROSS} Let's play it nicely, don't remove other's songs if you're not a moderator nor a deejay.`,
		COMMAND_REMOVE_SUCCESS: ({ song }) => `${GREENTICK} Removed the song **${song.safeTitle}** requested by <@${song.requester}>.`,
		COMMAND_SEEK_DESCRIPTION: 'Change the player time for the current song.',
		COMMAND_SEEK_SUCCESS: ({ time }) => `${GREENTICK} Successfully changed the time! Now at ${duration(time)}!`,
		COMMAND_RESUME_DESCRIPTION: 'Resumes the current song.',
		COMMAND_RESUME_SUCCESS: '▶ Resumed.',
		COMMAND_ROLESET_DESCRIPTION: 'Manage unique role sets.',
		COMMAND_ROLESET_EXTENDED: {
			extendedHelp: `A role set is a group of roles Skyra identifies as unique for all members in the server, i.e. a roleset named "region" could have the roles \`Africa\`, \`America\`, \`Asia\`, and \`Europe\`, and members will only be able to have one of them. This is like a kind of "rule" that is applied in the three following situations:

					- When somebody claims a role via the \`Skyra, roles\`.
					- When somebody claims a role via reaction roles.
					- When somebody receives a role either manually or from another bot.`,
			explainedUsage: [
				['add', 'Create a new roleset or add a role to an existing one.'],
				['remove', 'Remove a role from an existing roleset.'],
				['reset', 'Removes all roles from a roleset or, if not specified, all existing rolesets.'],
				['list', 'Lists all rolesets.'],
				['auto', 'Adds or removes a roleset.']
			],
			examples: [
				'add regions America',
				'add regions Africa America Asia Europe',
				'remove regions America',
				'reset',
				'reset regions',
				'list',
				'regions America',
				'regions Africa America Asia Europe'
			],
			reminder: 'This command can add and/or remove multiple roles at the same time.',
			multiline: true
		},
		COMMAND_ROLESET_CREATED: ({ name, roles }) => `The ${name} unique role set has been created with the following roles: ${roles}`,
		COMMAND_ROLESET_ADDED: ({ name, roles }) => `The ${name} unique role set now has the following roles as well: ${roles}.`,
		COMMAND_ROLESET_INVALID_NAME: ({ name }) => `You can not remove the ${name} unique role set because it does not exist.`,
		COMMAND_ROLESET_REMOVED: ({ name, roles }) => `The ${name} unique role set will no longer include the following roles: ${roles}`,
		COMMAND_ROLESET_RESET_EMPTY: `${REDCROSS} There are no rolesets configured in this groupo.`,
		COMMAND_ROLESET_RESET_ALL: `${GREENTICK} Successfully removed all rolesets.`,
		COMMAND_ROLESET_RESET_NOT_EXISTS: ({ name }) => `${REDCROSS} The roleset \`${name}\` does not exist in this server.`,
		COMMAND_ROLESET_RESET_GROUP: ({ name }) => `${GREENTICK} Successfully removed the roleset \`${name}\` from this server.`,
		COMMAND_ROLESET_UPDATED: ({ name }) => `The ${name} unique role set has been updated.`,
		COMMAND_ROLESET_NO_ROLESETS: 'You have no rolesets.',
		COMMAND_SHUFFLE_DESCRIPTION: 'Randomize the order of the songs in the queue.',
		COMMAND_SHUFFLE_SUCCESS: ({ amount }) => `${GREENTICK} Successfully randomized ${amount} songs.`,
		COMMAND_SKIP_DESCRIPTION: 'Skip the current song.',
		COMMAND_SKIP_PERMISSIONS: `${REDCROSS} You can't execute this command, you must be a DJ or a Moderator.`,
		COMMAND_SKIP_VOTES_VOTED: `${REDCROSS} You have already voted.`,
		COMMAND_SKIP_VOTES_TOTAL: ({ amount, needed }) => `🔸 | Votes: ${amount} of ${needed}`,
		COMMAND_SKIP_SUCCESS: ({ title }) => `⏭ Skipped **${title}**.`,
		COMMAND_PLAYING_TIME_DESCRIPTION: 'Check how much time is left for the song to end.',
		COMMAND_PLAYING_TIME_QUEUE_EMPTY: 'Are you speaking to me? Because my deck is empty...',
		COMMAND_PROMOTE_DESCRIPTION: 'Promote a song to the front of the queue',
		COMMAND_PROMOTE_EXTENDED: {
			explainedUsage: [['number', 'The index in the queue to promote to the front. Use `Skyra, queue` to find the index of a song']],
			examples: ['5'],
			reminder: 'This command requires that you are a DJ or a Moderator to use it'
		},
		COMMAND_PROMOTE_SUCCESS: ({ song }) => `${GREENTICK} Successfully promoted **${song.safeTitle}** (${song}) to the top of the queue`,
		COMMAND_VOLUME_DESCRIPTION: 'Manage the volume for current song.',
		COMMAND_VOLUME_SUCCESS: ({ volume }) => `📢 Volume: ${volume}%`,
		COMMAND_VOLUME_CHANGED: ({ emoji, volume }) => `${emoji} Volume set to: ${volume}%`,
		COMMAND_VOLUME_CHANGED_EXTREME: ({ emoji, text, volume }) => `${emoji} ${text} set to: ${volume}%`,
		COMMAND_VOLUME_CHANGED_TEXTS: createPick(['**EXTREME VOLUME**', '**AIRPLANE NACELLE-LIKE VOLUME**', '**FALCON HEAVY LAUNCH-LIKE VOLUME**']),

		INHIBITOR_MUSIC_QUEUE_EMPTY: `${REDCROSS} The queue\'s empty! The session will start as soon as we have some songs queued.`,
		INHIBITOR_MUSIC_NOT_PLAYING: `${REDCROSS} Hmm, doesn't look like I'm playing anything right now.`,
		INHIBITOR_MUSIC_PAUSED: `${REDCROSS} The queue's playing and the session is still up 'till the night ends!`,
		INHIBITOR_MUSIC_DJ_MEMBER: `${REDCROSS} I believe this is something only a moderator or a deejay of this session is supposed to do!`,
		INHIBITOR_MUSIC_USER_VOICE_CHANNEL: `${REDCROSS} Hey, I need you to join a voice channel before I can run this command!`,
		INHIBITOR_MUSIC_BOT_VOICE_CHANNEL: `${REDCROSS} I am afraid I need to be in a voice channel to operate this command, please show me the way!`,
		INHIBITOR_MUSIC_BOTH_VOICE_CHANNEL: `${REDCROSS} Hey! It looks like you\'re not in the same voice channel as me! Please come join me!`,
		INHIBITOR_MUSIC_NOTHING_PLAYING: `${REDCROSS} Looks like nothing is playing right now, how about you start the party 🎉?`,

		MUSICMANAGER_FETCH_NO_ARGUMENTS: 'I need you to give me the name of a song!',
		MUSICMANAGER_FETCH_NO_MATCHES: "I'm sorry but I wasn't able to find the track!",
		MUSICMANAGER_FETCH_LOAD_FAILED: "I'm sorry but I couldn't load this song! Maybe try other song!",
		MUSICMANAGER_TOO_MANY_SONGS: `${REDCROSS} Woah there, you are adding more songs than allowed!`,
		MUSICMANAGER_SETVOLUME_SILENT: 'Woah, you can just leave the voice channel if you want silence!',
		MUSICMANAGER_SETVOLUME_LOUD: "I'll be honest, an airplane's nacelle would be less noisy than this!",
		MUSICMANAGER_PLAY_NO_SONGS: 'No songs left in the queue!',
		MUSICMANAGER_PLAY_PLAYING: "Decks' spinning, can't you hear it?",
		MUSICMANAGER_STUCK: ({ milliseconds }) => `${LOADING} Hold on, I got a little problem, I'll be back in: ${duration(milliseconds)}!`,

		COMMAND_CONF_MENU_NOPERMISSIONS: `I need the permissions ${PERMS.ADD_REACTIONS} and ${PERMS.MANAGE_MESSAGES} to be able to run the menu.`,
		COMMAND_CONF_MENU_RENDER_AT_FOLDER: ({ path }) => `Currently at: 📁 ${path}`,
		COMMAND_CONF_MENU_RENDER_AT_PIECE: ({ path }) => `Currently at: ⚙️ ${path}`,
		COMMAND_CONF_MENU_RENDER_NOKEYS: 'There are no configurable keys for this folder',
		COMMAND_CONF_MENU_RENDER_SELECT: "Please type in any of the following entries' names",
		COMMAND_CONF_MENU_RENDER_TCTITLE: 'Text Commands:',
		COMMAND_CONF_MENU_RENDER_UPDATE: '• Update Value → `set <value>`',
		COMMAND_CONF_MENU_RENDER_REMOVE: '• Remove Value → `remove <value>`',
		COMMAND_CONF_MENU_RENDER_RESET: '• Reset Value → `reset`',
		COMMAND_CONF_MENU_RENDER_UNDO: '• Undo Update → `undo`',
		COMMAND_CONF_MENU_RENDER_CVALUE: ({ value }) => `Current Value: **\`\`${value}\`\`**`,
		COMMAND_CONF_MENU_RENDER_BACK: 'Press ◀ to go back',
		COMMAND_CONF_MENU_INVALID_KEY: 'Invalid Key, please try again with any of the following options.',
		COMMAND_CONF_MENU_INVALID_ACTION: 'Invalid Action, please try again with any of the following options.',
		COMMAND_CONF_MENU_SAVED: 'Successfully saved all changes.',

		SETTINGS_PREFIX:
			'A prefix is an affix that is added in front of the word, in this case, the message. It allows bots to distinguish between a regular message and a command.',
		SETTINGS_LANGUAGE: 'The language I will use for your server. It may not be available in the language you want.',
		SETTINGS_DISABLENATURALPREFIX: 'Whether or not I should listen for my natural prefix, `Skyra,`',
		SETTINGS_DISABLEDCOMMANDS:
			'The disabled commands, core commands may not be disabled, and moderators will override this. All commands must be in lower case.',
		SETTINGS_CHANNELS_ANNOUNCEMENTS:
			'The channel for announcements, in pair with the key `roles.subscriber`, they are required for the announce command.',
		SETTINGS_CHANNELS_FAREWELL:
			'The channel I will use to send farewells, you must enable the events and set up the messages, in other categories.',
		SETTINGS_CHANNELS_GREETING:
			'The channel I will use to send greetings, you must enable the events and set up the messages, in other categories.',
		SETTINGS_CHANNELS_IMAGE_LOGS: 'The channel I will use to re-upload all images I see.',
		SETTINGS_CHANNELS_MEMBER_LOGS:
			'The channel for member logs, you must enable the events (`events.memberAdd` for new members, `events.memberRemove` for members who left).',
		SETTINGS_CHANNELS_MESSAGE_LOGS:
			'The channel for (non-NSFW) message logs, you must enable the events (`events.messageDelete` for deleted messages, `events.messageEdit` for edited messages).',
		SETTINGS_CHANNELS_MODERATION_LOGS:
			'The channel for moderation logs, once enabled, I will post all my moderation cases there. If `events.banRemove` and/or `events.banRemove` are enabled, I will automatically post anonymous logs.',
		SETTINGS_CHANNELS_NSFW_MESSAGE_LOGS:
			'The channel for NSFW message logs, same requirement as normal message logs, but will only send NSFW messages.',
		SETTINGS_CHANNELS_PRUNE_LOGS: 'The channel for prune logs, same requirement as normal mesasge logs, but will only send prune messages.',
		SETTINGS_CHANNELS_REACTION_LOGS:
			"The channel for the reaction logs, same requirement as normal message logs, but will only send message reactions. If you don't want twemojis to be logged you can toggle `events.twemoji-reactions`.",
		SETTINGS_CHANNELS_ROLES: 'The channel for the reaction roles.',
		SETTINGS_CHANNELS_SPAM: 'The channel for me to redirect users to when they use commands I consider spammy.',
		SETTINGS_CHANNELS_IGNORE_MESSAGE_DELETE: 'Channels I should ignore when checking for deleted messages to log.',
		SETTINGS_CHANNELS_IGNORE_MESSAGE_EDIT: 'Channels I should ignore when checking for edited messags to log.',
		SETTINGS_CHANNELS_IGNORE_REACTION_ADD: 'Channels I should ignore when checking for added reactions.',
		SETTINGS_CHANNELS_IGNORE_ALL: 'Channels I should ignore for all types of logging.',
		SETTINGS_DISABLEDCHANNELS:
			'A list of channels for disabled commands, for example, setting up a channel called general will forbid all users from using my commands there. Moderators+ override this purposedly to allow them to moderate without switching channels.',
		SETTINGS_EVENTS_BANADD: 'This event posts anonymous moderation logs when a user gets banned. You must set up `channels.moderation-logs`.',
		SETTINGS_EVENTS_BANREMOVE:
			'This event posts anonymous moderation logs when a user gets unbanned. You must set up `channels.moderation-logs`.',
		SETTINGS_EVENTS_MEMBERADD: 'This event posts member logs when a user joins. They will be posted in `channels.member-logs`.',
		SETTINGS_EVENTS_MEMBERNAMEUPDATE: 'Whether member nickname updates should be logged or not.',
		SETTINGS_EVENTS_MEMBERREMOVE: 'This event posts member logs when a user leaves. They will be posted in `channels.member-logs`.',
		SETTINGS_EVENTS_MESSAGEDELETE:
			'This event posts message logs when a message is deleted. They will be posted in `channels.message-logs` (or `channel.nsfw-message-logs` in case of NSFW channels).',
		SETTINGS_EVENTS_MESSAGEEDIT:
			'This event posts message logs when a message is edited. They will be posted in `channels.message-logs` (or `channel.nsfw-message-logs` in case of NSFW channels).',
		SETTINGS_EVENTS_TWEMOJI_REACTIONS: 'Whether or not twemoji reactions are posted in the reaction logs channel.',
		SETTINGS_MESSAGES_FAREWELL: 'The message I shall send to when a user leaves. You must set up `channels.farewell` and `events.memberRemove`',
		SETTINGS_MESSAGES_GREETING: 'The message I shall send to when a user joins. You must set up `channels.greeting` and `events.memberAdd`',
		SETTINGS_MESSAGES_IGNORECHANNELS: 'The channels configured to not increase the point counter for users.',
		SETTINGS_MESSAGES_JOIN_DM: 'The message I shall send to when a user joins in DMs.',
		SETTINGS_MESSAGES_MODERATION_AUTO_DELETE: 'Whether or not moderation commands should be auto-deleted or not.',
		SETTINGS_MESSAGES_MODERATION_DM: 'Whether or not I should send a direct message to the target user on moderation actions.',
		SETTINGS_MESSAGES_MODERATION_MESSAGE_DISPLAY: 'Whether or not a response should be sent for moderation commands.',
		SETTINGS_MESSAGES_MODERATION_REASON_DISPLAY: 'Whether the reason will be displayed in moderation commands.',
		SETTINGS_MESSAGES_MODERATOR_NAME_DISPLAY:
			'Whether or not I should display the name of the moderator who took the action whne sending the target user a moderation message. Requires `messages.moderation-dm` to be enabled.',
		SETTINGS_MESSAGES_WARNINGS: 'Whether or not I should send warnings to the user when they receive one.',
		SETTINGS_MESSAGES_ANNOUNCEMENT_EMBED: 'Whether to send announcements in embeds or not',
		SETTINGS_MUSIC_ALLOW_STREAMS: 'Whether livestreams should be allowed to be played.',
		SETTINGS_MUSIC_DEFAULT_VOLUME: 'The default music volume to start playing at for this server.',
		SETTINGS_MUSIC_MAXIMUM_DURATION: 'The maximum length any playable single track can have.',
		SETTINGS_MUSIC_MAXIMUM_ENTRIES_PER_USER: 'The maximum amount of entries one user can have in the queue.',
		SETTINGS_NO_MENTION_SPAM_ALERTS: 'Whether or not users should be alerted when they are about to get the ban hammer.',
		SETTINGS_NO_MENTION_SPAM_ENABLED: 'Whether or not I should have the ban hammer ready for mention spammers.',
		SETTINGS_NO_MENTION_SPAM_MENTIONSALLOWED:
			'The minimum amount of "points" a user must accumulate before landing the hammer. A user mention will count as 1 point, a role mention as 2 points, and an everyone/here mention as 5 points.',
		SETTINGS_NO_MENTION_SPAM_TIMEPERIOD:
			'The amount of time in seconds in which the mention bucket should refresh. For example, if this is set to `8` and you mentioned two users 7 seconds apart, the bucket would run from start with the accumulated amount of points.',
		SETTINGS_ROLES_ADMIN: `The administrator role, their priviledges in Skyra will be upon moderative, covering management. Defaults to anyone with the ${PERMS.MANAGE_GUILD} permission.`,
		SETTINGS_ROLES_DJ: "The DJ role for this server. DJs have more advanced control over Skyra's music commands.",
		SETTINGS_ROLES_INITIAL: 'The initial role, if configured, I will give it to users as soon as they join.',
		SETTINGS_ROLES_MODERATOR:
			'The moderator role, their priviledges will cover almost all moderation commands. Defaults to anyone who can ban members.',
		SETTINGS_ROLES_MUTED:
			'The muted role, if configured, I will give new muted users this role. Otherwise I will prompt you the creation of one.',
		SETTINGS_ROLES_PUBLIC: 'The public roles, they will be given with no cost to any user using the `roles` command.',
		SETTINGS_ROLES_REMOVEINITIAL: 'Whether the claim of a public role should remove the initial one too.',
		SETTINGS_ROLES_RESTRICTED_ATTACHMENT: 'The role that is used for the restrictAttachment moderation command',
		SETTINGS_ROLES_RESTRICTED_EMBED: 'The role that is used for the restrictEmbed moderation command.',
		SETTINGS_ROLES_RESTRICTED_EMOJI: 'The role that is used for the restrictEmoji moderation command.',
		SETTINGS_ROLES_RESTRICTED_REACTION: 'The role that is used for the restrictReaction moderation command.',
		SETTINGS_ROLES_RESTRICTED_VOICE: 'The role that is used for the restrictVoice moderation command.',
		SETTINGS_ROLES_SUBSCRIBER:
			'The subscriber role, this role will be mentioned every time you use the `announce` command. I will always keep it non-mentionable so people do not abuse mentions.',
		SETTINGS_SELFMOD_ATTACHMENT: 'Whether or not the attachment filter is enabled.',
		SETTINGS_SELFMOD_ATTACHMENTMAXIMUM:
			'The amount of attachments a user can send within the specified duration defined at `selfmod.attachmentDuration`.',
		SETTINGS_SELFMOD_CAPITALS_ENABLED: 'Whether the capitals filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_CAPITALS_IGNOREDCHANNELS: 'The channels that will be ignored by the capitals filter sub-system',
		SETTINGS_SELFMOD_CAPITALS_IGNOREDROLES: 'The roles that will be ignored by the capitals afilters sub-system',
		SETTINGS_SELFMOD_CAPITALS_MAXIMUM:
			'The maximum amount of characters the messages must have before trying to delete it. You must enable it with the `capitalsMode` command.',
		SETTINGS_SELFMOD_CAPITALS_MINIMUM:
			'The minimum amount of characters the message must have before trying to delete it. You must enable it with the `capitalsMode` command.',
		SETTINGS_SELFMOD_FILTER_ENABLED: 'Whether the word filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_FILTER_IGNOREDCHANNELS: 'The channels that will be ignored by the filters sub-system',
		SETTINGS_SELFMOD_FILTER_IGNOREDROLES: 'The roles that will be ignored by the filters sub-system',
		SETTINGS_SELFMOD_IGNORECHANNELS:
			'The channels I will ignore, be careful any channel configured will have all auto-moderation systems (CapsFilter, InviteLinks, and NoMentionSpam) deactivated.',
		SETTINGS_SELFMOD_INVITES_ENABLED: 'Whether the invites filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_INVITES_IGNOREDCHANNELS: 'The channels that will be ignored by the invites sub-system',
		SETTINGS_SELFMOD_INVITES_IGNOREDROLES: 'The roles that will be ignored by the invites sub-system',
		SETTINGS_SELFMOD_INVITES_IGNOREDCODES: 'The Discord invite codes that will be ignored by the invites sub-system',
		SETTINGS_SELFMOD_INVITES_IGNOREDGUILDS: 'The Discord servers that will be ignored by the invites sub-system',
		SETTINGS_SELFMOD_LINKS_ENABLED: 'Whether the links filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_LINKS_IGNOREDCHANNELS: 'The channels that will be ignored by the links filter sub-system',
		SETTINGS_SELFMOD_LINKS_IGNOREDROLES: 'The roles that will be ignored by the links filters sub-system',
		SETTINGS_SELFMOD_LINKS_WHITELIST: 'The whitelisted links that are allowed',
		SETTINGS_SELFMOD_MESSAGES_ENABLED: 'Whether Skyra should attempt to remove duplicated messages or not.',
		SETTINGS_SELFMOD_MESSAGES_IGNOREDCHANNELS: 'The channels that will be ignored by the duplicate messages sub-system',
		SETTINGS_SELFMOD_MESSAGES_IGNOREDROLES: 'The roles that will be ignored by the duplicate messages sub-system',
		SETTINGS_SELFMOD_MESSAGES_MAXIMUM:
			'The amount of duplicated messages required in the queue before taking action The queue size is configurable in `selfmod.messages.queue-size`.',
		SETTINGS_SELFMOD_MESSAGES_QUEUE_SIZE: 'The amount of messages Skyra will keep track of for the message duplication detection.',
		SETTINGS_SELFMOD_NEWLINES_ENABLED: 'Whether the new lines filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_NEWLINES_IGNOREDCHANNELS: 'The channels that will be ignored by the new lines sub-system',
		SETTINGS_SELFMOD_NEWLINES_IGNOREDROLES: 'The roles that will be ignored by the new lines sub-system',
		SETTINGS_SELFMOD_NEWLINES_MAXIMUM: 'The maximum amount of new lines before Skyra will start applying penalties',
		SETTINGS_SELFMOD_RAID: 'Whether or not I should kick users when they try to raid the server.',
		SETTINGS_SELFMOD_RAIDTHRESHOLD:
			'The minimum amount of users joined on the last 20 seconds required before starting to kick them and anybody else who joins until a minute cooldown or forced cooldown (using the `raid` command to manage this).',
		SETTINGS_SELFMOD_REACTIONS_MAXIMUM: 'The maximum amount of reactions before I will start applying penalties',
		SETTINGS_SELFMOD_REACTIONS_BLACKLIST: 'The reactions that are blacklisted',
		SETTINGS_SELFMOD_REACTIONS_ENABLED: 'Whether the reactions filter selfmod sub-system is enabled or not.',
		SETTINGS_SELFMOD_REACTIONS_IGNOREDCHANNELS: 'The channels that will be ignored by the reactions sub-system',
		SETTINGS_SELFMOD_REACTIONS_IGNOREDROLES: 'The roles that will be ignored by the reactons sub-system',
		SETTINGS_SELFMOD_REACTIONS_WHITELIST: 'The reactions that are whitelisted',
		SETTINGS_SOCIAL_ENABLED: 'Whether the social module should be enabled or not',
		SETTINGS_SOCIAL_MULTIPLIER: 'The multiplier to apply to the gain of points for users',
		SETTINGS_SOCIAL_ACHIEVE: 'Whether or not I should congratulate people who get a new leveled role.',
		SETTINGS_SOCIAL_ACHIEVEMESSAGE:
			'The congratulation message for people when they get a new leveled role. Requires `social.achieve` to be enabled.',
		SETTINGS_SOCIAL_IGNORECHANNELS: 'The channels I should ignore when adding points.',
		SETTINGS_STARBOARD_CHANNEL:
			'The starboard channel. If you star a message, it will be posted there. Using the `setStarboardEmoji` command allows the emoji customization.',
		SETTINGS_STARBOARD_IGNORECHANNELS: 'The channels I should ignore when listening for new stars.',
		SETTINGS_STARBOARD_MINIMUM: 'The minimum amount of stars required before a message is posted to the starboard channel.',
		SETTINGS_SUGGESTIONS_CHANNEL: 'The channel where suggestions will be sent.',
		SETTINGS_SUGGESTIONS_EMOJIS_UPVOTE: 'The upvote emoji Skyra reacts with on every suggestion.',
		SETTINGS_SUGGESTIONS_EMOJIS_DOWNVOTE: 'The downvote emoji Skyra reacts with on every suggestion.',
		SETTINGS_SUGGESTIONS_ON_ACTION_DM: "If this setting is enabled, Skyra will DM the suggestion's author every time it is updated.",
		SETTINGS_SUGGESTIONS_ON_ACTION_REPOST:
			"If this setting is enabled, Skyra will repost the suggestion's message every time it is updated. If it is disabled, it will edit the original message.",
		SETTINGS_SUGGESTIONS_ON_ACTION_HIDE_AUTHOR:
			"This setting allows you to update suggestions anonymously. It will substitute the updater's name with either `An administrator` or `A moderator`, according to their permission level.",

		/**
		 * ################
		 * ANIMALS COMMANDS
		 */

		COMMAND_CATFACT_DESCRIPTION: 'Let me tell you a mysterious cat fact.',
		COMMAND_CATFACT_EXTENDED: {
			extendedHelp: `Do **you** know cats are very curious, right? They certainly have a lot of fun and weird facts.
				This command queries catfact.ninja and retrieves a fact so you can read it.`
		},
		COMMAND_DOG_DESCRIPTION: 'Cute doggos! ❤',
		COMMAND_DOG_EXTENDED: {
			extendedHelp: `Do **you** know how cute dogs are? They are so beautiful! This command uses a tiny selection of images
					From WallHaven, but the ones with the greatest quality! I need to find more of them, and there are
					some images that, sadly, got deleted and I cannot retrieve them 💔.`
		},
		COMMAND_FOX_DESCRIPTION: 'Let me show you an image of a fox!',
		COMMAND_FOX_EXTENDED: {
			extendedHelp: `This command provides you a random image from PixaBay, always showing 'fox' results. However,
				it may not be exactly accurate and show you other kinds of foxes.`
		},
		COMMAND_KITTY_DESCRIPTION: 'KITTENS!',
		COMMAND_KITTY_EXTENDED: {
			extendedHelp: `Do **you** know how cute are kittens? They are so beautiful! This command uses a tiny selection of images
				From WallHaven, but the ones with the greatest quality! I need to find more of them, and there are
				some images that, sadly, got deleted and I cannot retrieve them 💔.`
		},
		COMMAND_SHIBE_DESCRIPTION: 'Cute shibes!',
		COMMAND_SHIBE_EXTENDED: {
			extendedHelp: "Everyone loves shibes, I shall love them aswell! They're so adorable ❤."
		},

		/**
		 * ##############
		 * ANIME COMMANDS
		 */

		COMMAND_ANIME_DESCRIPTION: 'Search your favourite anime by title with this command.',
		COMMAND_ANIME_EXTENDED: {
			extendedHelp: 'This command queries Kitsu.io to show data for the anime you request.',
			explainedUsage: [['query', "The anime's name you are looking for."]],
			examples: ['One Piece']
		},
		COMMAND_MANGA_DESCRIPTION: 'Search your favourite manga by title with this command.',
		COMMAND_MANGA_EXTENDED: {
			extendedHelp: 'This command queries Kitsu.io to show data for the manga you request.',
			explainedUsage: [['query', "The manga's name you are looking for."]],
			examples: ['Stone Ocean', 'One Piece']
		},
		COMMAND_WAIFU_DESCRIPTION: 'Posts a randomly generated waifu image.',
		COMMAND_WAIFU_EXTENDED: {
			extendedHelp: 'This commands posts a random waifu generated by <https://thiswaifudoesnotexist.net/>'
		},

		/**
		 * #####################
		 * ANNOUNCEMENT COMMANDS
		 */

		COMMAND_ANNOUNCEMENT_DESCRIPTION: 'Send new announcements, mentioning the announcement role.',
		COMMAND_ANNOUNCEMENT_EXTENDED: {
			extendedHelp: [
				`This command requires an announcement channel (**channels.announcement** in the configuration command)
					which tells Skyra where she should post the announcement messages.`,
				'',
				`Question is, is this command needed? Well, nothing stops you from making your announcements by yourself, however, there are many people who hate
					being mentioned by at everyone/here.`,
				'',
				`To avoid this, Skyra gives you the option of creating a subscriber role,
					which is unmentionable (to avoid people spam mentioning the role), and once you run this command,
					Skyra will set the role to be mentionable, post the message, and back to unmentionable.`,
				'',
				`Furthermore, you can configure Skyra to send the announcement as a message embed by setting the **messages.announcement-embed**
					option in the configuration command. When sending the message as an an embed you can exclude the mentions of any users, @here or @everyone
					by providing the \`--excludeMentions\` flag to the announcement.`
			].join('\n'),
			explainedUsage: [['announcement', 'The announcement text to post.']],
			examples: ['I am glad to announce that we have a bot able to safely send announcements for our subscribers!'],
			reminder: `If you want to edit the message you send in an announcement,
				just edit the message you used to have Skyra send that announcement.
				Skyra will then edit the message she sent previously. She can do this
				up to 15 minutes after the initial announcement, so be sure to not wait
				long!`,
			multiline: true
		},
		COMMAND_SUBSCRIBE_DESCRIPTION: "Subscribe to this server's announcements.",
		COMMAND_SUBSCRIBE_EXTENDED: {
			extendedHelp: `This command serves the purpose of **giving** you the subscriber role, which must be configured by the
				server's administrators. When a moderator or administrator use the **announcement** command, you
					will be mentioned. This feature is meant to replace everyone/here tags and mention only the interested
					users.`
		},
		COMMAND_UNSUBSCRIBE_DESCRIPTION: "Unsubscribe from this server's announcements.",
		COMMAND_UNSUBSCRIBE_EXTENDED: {
			extendedHelp: `This command serves the purpose of **removing** you the subscriber role, which must be configured by the
					server's administrators. When a moderator or administrator use the **announcement** command, you
					will **not longer** be mentioned. This feature is meant to replace everyone/here tags and mention
					only the interested users.`
		},

		/**
		 * ############
		 * FUN COMMANDS
		 */

		COMMAND_8BALL_DESCRIPTION: 'Skyra will read the Holy Bible to find the correct answer for your question.',
		COMMAND_8BALL_EXTENDED: {
			extendedHelp: "This command provides you a random question based on your questions' type. Be careful, it may be too smart.",
			explainedUsage: [['question', 'The Holy Question']],
			examples: ['Why did the chicken cross the road?']
		},
		COMMAND_CHOICE_DESCRIPTION: 'Eeny, meeny, miny, moe, catch a tiger by the toe...',
		COMMAND_CHOICE_EXTENDED: {
			extendedHelp: `I have an existencial doubt... should I wash the dishes or throw them through the window? The search
					continues. List me items separated by comma and I will choose one them. On a side note, I am not
					responsible of what happens next.`,
			explainedUsage: [['words', 'A list of words separated by comma.']],
			examples: ['Should Wash the dishes, Throw the dishes out the window', 'Cat, Dog']
		},
		COMMAND_CHANGEMYMIND_DESCRIPTION: 'Skyra is the best, change my mind.',
		COMMAND_CHANGEMYMIND_EXTENDED: {
			extendedHelp: "I still think I'm the best, change my mind. I make a photo with your avatar and some text in some paper.",
			explainedUsage: [['text', 'The phrase you want.']],
			examples: ['Skyra is the best bot in this server']
		},
		COMMAND_DICE_DESCRIPTION: 'Roll the dice using d20 syntax.',
		COMMAND_DICE_EXTENDED: {
			extendedHelp: `The mechanics of this command are easy. You have a dice, then you roll it __x__ times, but the dice
				can also be configured to have __y__ sides. By default, this command rolls a dice with 6 sides once.
				However, you can change the amount of rolls for the dice, and this command will 'roll' (get a random
				number between 1 and the amount of sides). For example, rolling a dice with 6 sides 3 times will leave
				a random sequence of three random numbers between 1 and 6, for example: 3, 1, 6; And this command will
				return 10 as output.`,
			examples: ['370d24', '100d6', '6']
		},
		COMMAND_ESCAPEROPE_DESCRIPTION: 'Use the escape rope from Pokemon.',
		COMMAND_ESCAPEROPE_EXTENDED: {
			extendedHelp: '**Skyra** used **Escape Rope**.'
		},
		COMMAND_HOWTOFLIRT_DESCRIPTION: 'Captain America, you do not know how to flirt.',
		COMMAND_HOWTOFLIRT_EXTENDED: {
			extendedHelp: `Let me show you how to effectively flirt with somebody using the Tony Stark's style for Captain
				America, I can guarantee that you'll get him.`,
			explainedUsage: [['user', 'The user to flirt with.']],
			examples: ['Skyra']
		},
		COMMAND_LOVE_DESCRIPTION: 'Lovemeter, online!',
		COMMAND_LOVE_EXTENDED: {
			extendedHelp: `Hey! Wanna check the lovemeter? I know it's a ridiculous machine, but many humans love it!
					Don't be shy and try it!`,
			explainedUsage: [['user', 'The user to rate.']],
			examples: ['Skyra']
		},
		COMMAND_MARKOV_DESCRIPTION: 'Generate a Markov Chain from the text channel.',
		COMMAND_MARKOV_EXTENDED: {
			extendedHelp: `A Markov chain is a stocha... what? Okay, something something a probability theory made by a
					Russian mathematician, check Wikipedia for more information. **In short**: I will generate a random
					message given the content of the messages in the channel.`,
			examples: ['']
		},
		COMMAND_NORRIS_DESCRIPTION: "Enjoy your day reading Chuck Norris' jokes.",
		COMMAND_NORRIS_EXTENDED: {
			extendedHelp: `Did you know that Chuck norris does **not** call the wrong number, but you **answer** the wrong phone?
					Woah, mindblow. He also threw a carton of milk and created the Milky Way. This command queries chucknorris.io
					and retrieves a fact (do not assume they're false, not in front of him) so you can read it`
		},
		COMMAND_RATE_DESCRIPTION: 'Let bots have opinions and rate somebody.',
		COMMAND_RATE_EXTENDED: {
			extendedHelp: `Just because I am a bot doesn't mean I cannot rate you properly. I can grade you with a random number
					generator to ease the process. Okay okay, it's not fair, but I mean... I can also give you a 💯.`,
			explainedUsage: [['user', 'The user to rate.']],
			examples: ['Skyra', 'me']
		},
		COMMAND_XKCD_DESCRIPTION: 'Read comics from XKCD.',
		COMMAND_XKCD_EXTENDED: {
			extendedHelp: `**xkcd** is an archive for nerd comics filled with math, science, sarcasm and languages. If you don't
					provide any argument, I will get a random comic from xkcd. If you provide a number, I will retrieve
					the comic with said number. But if you provide a title/text/topic, I will fetch a comic that matches
					with your input and display it. For example, \`Skyra, xkcd Curiosity\` will show the comic number 1091.`,
			explainedUsage: [['query', 'Either the number of the comic, or a title to search for.']],
			examples: ['1091', 'Curiosity']
		},
		COMMAND_PUN_DESCRIPTION: 'Shows you a random pun.',
		COMMAND_PUN_EXTENDED: {
			extendedHelp: [
				'A steak pun is a rare medium well done.',
				'Get your daily doses of dad jokes from icanhazdadjoke.com and laugh at witty wisecracks.'
			].join('\n'),
			multiline: true
		},
		COMMAND_WAKANDA_DESCRIPTION: "Helpful descriptions? We don't do that here",
		COMMAND_WAKANDA_EXTENDED: {
			extendedHelp: `Creates an image macro using the [We Don't Do That Here Meme](https://knowyourmeme.com/memes/we-dont-do-that-here)
			using the given user.`
		},
		/**
		 * ################
		 * GAME INTEGRATION COMMANDS
		 */

		COMMAND_BRAWLSTARS_DESCRIPTION: "Get data on a player or club from Supercell's newest game, Brawl Stars.",
		COMMAND_BRAWLSTARS_EXTENDED: {
			explainedUsage: [
				['category', 'The category of data to get: **club** to get data on a club, or **player** to get data on a player (default).'],
				['query', 'The tag of the player or club, depending on which category you choose.']
			],
			examples: ['player #RJQLQ999', 'club #228JVRQC9']
		},
		COMMAND_BRAWLSTARS_PLAYER_EMBED_TITLES: {
			TROPHIES: 'Trophies',
			EVENTS: 'Events',
			EXP: 'Experience',
			GAME_MODES: 'Game Modes',
			OTHER: 'Other'
		},
		COMMAND_BRAWLSTARS_PLAYER_EMBED_FIELDS: {
			TOTAL: 'Total',
			PERSONAL_BEST: 'Personal Best',
			EVENTS: 'Events',
			ROBO_RUMBLE: 'Best Robo Rumble Rank',
			BOSS_FIGHT: 'Best Big Brawler Rank',
			EXPERIENCE_LEVEL: 'Experience Level',
			VICTORIES_3V3: '3v3 Victories',
			VICTORIES_SOLO: 'Solo Victories',
			VICTORIES_DUO: 'Duo Victories',
			CLUB: 'Club',
			BRAWLERS_UNLOCKED: 'Brawlers Unlocked'
		},
		COMMAND_BRAWLSTARS_CLUB_EMBED_TITLES: {
			TOTAL_TROPHIES: 'Total Trophies',
			AVERAGE_TROPHIES: 'Average Trophies',
			REQUIRED_TROPHIES: 'Required Trophies',
			MEMBERS: 'Members',
			TYPE: 'Type',
			TOP_5_MEMBERS: 'Top 5 Members',
			PRESIDENT: 'President'
		},
		COMMAND_BRAWLSTARS_CLUB_EMBED_FIELDS: {
			NO_PRESIDENT: 'No President'
		},
		COMMAND_CLASHOFCLANS_DESCRIPTION: 'Get data on a player or clan in the popular mobile game Clash of Clans',
		COMMAND_CLASHOFCLANS_EXTENDED: {
			extendedHelp: 'The request for clans will try to return multiple possible responses.',
			explainedUsage: [
				['category', 'The category of data to get: **clan** to get data on a clan or **player** to get data on a player.'],
				['query', 'Either a clan name or player tag depending on the category you chose.']
			],
			examples: ['player #8GQPJG2CL', 'clan Hog Raiders Swe']
		},
		COMMAND_CLASHOFCLANS_PLAYER_EMBED_TITLES: {
			XP_LEVEL: 'XP level',
			BUILDER_HALL_LEVEL: 'Builder Hall level',
			TOWNHALL_LEVEL: 'Town Hall level',
			TOWNHALL_WEAPON_LEVEL: 'Town Hall weapon level',

			TROPHIES: 'Current trophies',
			BEST_TROPHIES: 'Best trophies',
			WAR_STARS: 'War stars',

			ATTACK_WINS: 'Wins attacking',
			DEFENSE_WINS: 'Wins defending',
			AMOUNT_OF_ACHIEVEMENTS: 'Amount of achievements',

			VERSUS_TROPHIES: 'Current versus trophies',
			BEST_VERSUS_TROPHIES: 'Best versus trophies',
			VERSUS_BATTLE_WINS: 'Versus battle wins',

			CLAN_ROLE: 'Clan role',
			CLAN_NAME: 'Clan name',
			LEAGUE_NAME: 'League name',
			NO_TOWNHALL_WEAPON_LEVEL: 'Town Hall has no weapon level',
			NO_ROLE: 'This player has no clan role',
			NO_CLAN: 'This player is not in a clan',
			NO_LEAGUE: 'This user is not in any league'
		},
		COMMAND_CLASHOFCLANS_CLAN_EMBED_TITLES: {
			CLAN_LEVEL: 'Clan level',
			CLAN_POINTS: 'Clan points',
			CLAN_VERSUS_POINTS: 'Clan versus points',
			AMOUNT_OF_MEMBERS: 'Amount of members',
			DESCRIPTION: 'Description',
			LOCATION_NAME: 'Location name',
			WAR_FREQUENCY: 'War frequency',
			WAR_WIN_STREAK: 'War win streak',
			WAR_WINS: 'Total war wins',
			WAR_TIES: 'Total war ties',
			WAR_LOSSES: 'Total war losses',
			WAR_LOG_PUBLIC: 'War log is public?',
			UNKNOWN: 'Unknown',
			WAR_FREQUENCY_DESCR: {
				moreThanOncePerWeek: 'More than once per week',
				always: 'Always',
				lessThanOncePerWeek: 'Less than once per week',
				oncePerWeek: 'Once per week',
				unknown: 'Unknown'
			},
			WAR_LOG_PUBLIC_DESCR: ({ isWarLogPublic }) => (isWarLogPublic ? 'Yes' : 'No')
		},
		COMMAND_CLASHOFCLANS_INVALID_PLAYER_TAG: ({ playertag }) =>
			`I am sorry, \`${playertag}\` is not a valid Clash of Clans player tag. Player tags have to start with a \`#\` followed by the ID.`,
		COMMAND_CLASHOFCLANS_CLANS_QUERY_FAIL: ({ clan }) => `I am sorry, but I was unable to get data on the clan \`${clan}\`.`,
		COMMAND_CLASHOFCLANS_PLAYERS_QUERY_FAIL: ({ playertag }) =>
			`I am sorry, but I was unable to get data on the player with player tag \`${playertag}\`.`,
		COMMAND_FFXIV_DESCRIPTION: 'Queries the Final Fantasy 14 API for game data',
		COMMAND_FFXIV_EXTENDED: {
			extendedHelp: `This command allows you to character and item data for FFXIV.
				For item a wildcard search is performed so if your term is in the middle of the name it can still match.`,
			explainedUsage: [
				['search type', '(optional, defaults to `character`) `character` or `item`'],
				['query', 'The player or thing to search.']
			],
			examples: ['character Laytlan Ardevon', 'Laytlan Ardevon', 'item potion']
		},
		COMMAND_FFXIV_CHARACTER_FIELDS: {
			SERVER_AND_DC: 'Server - Datacenter',
			TRIBE: 'Tribe',
			CHARACTER_GENDER: 'Character gender',
			NAMEDAY: 'Nameday',
			GUARDIAN: 'Guardian',
			CITY_STATE: 'City-State',
			GRAND_COMPANY: 'Grand Company',
			RANK: 'Rank',
			NONE: 'None',
			MALE: 'Male',
			FEMALE: 'Female',
			DOW_DOM_CLASSES: '***__Disciple of War and Magic classes__***:',
			TANK: 'Tank',
			HEALER: 'Healer',
			MELEEDPS: 'Melee DPS',
			PHYSICALRANGEDDPS: 'Physical Ranged DPS',
			MAGICALRANGEDDPS: 'Magical Ranged DPS',
			DOH_CLASSES: '***__Disciple of the Hand jobs__***:',
			DOL_CLASSES: '***__Disciple of the Land jobs__***:'
		},
		COMMAND_FFXIV_ITEM_FIELDS: {
			KIND: 'Kind',
			CATEGORY: 'Category',
			LEVEL_EQUIP: 'Level equippable',
			NONE: 'None'
		},
		COMMAND_FFXIV_NO_CHARACTER_FOUND: `${REDCROSS} I am sorry, but I was unable to find a character with that name.`,
		COMMAND_FFXIV_INVALID_SERVER: `${REDCROSS} I am sorry, but an invalid server name was passed.`,
		COMMAND_FFXIV_NO_ITEM_FOUND: `${REDCROSS} I am sorry, but I was unable to find an item with that query.`,
		COMMAND_FORTNITE_DESCRIPTION: 'Gets player statistics for a Fortnite player',
		COMMAND_FORTNITE_EXTENDED: {
			extendedHelp: 'This command retrieves statistics for any Fortnite player that plays on PC, Xbox or Playstation',
			explainedUsage: [
				['platform', '(optional, defaults to `pc`) Platform the player plays on, one of `pc`, `xbox`, or `psn`.'],
				['player', 'The Epic Games username of the player.']
			],
			examples: ['ninja', 'pc ninja', 'xbox TTV R1xbox', 'psn TTV IllusionOG']
		},
		COMMAND_FORTNITE_NO_USER: [
			'I am sorry, but I was unable to find a user with that name.',
			'Are you sure that they play on the provided platform? (PC [default], Xbox or PSN are supported)'
		].join('\n'),
		COMMAND_FORTNITE_TITLES: {
			TITLE: ({ epicUserHandle }) => `Fortnite player statistics for ${epicUserHandle}`,
			LIFETIME_STATS: '**_Lifetime Stats_**',
			SOLOS: '**_Solos_**',
			DUOS: '**_Duos_**',
			SQUADS: '**_Squads_**',
			WINS: ({ count }) => `Wins: **\`${count}\`**`,
			KILLS: ({ count }) => `Kills: **\`${count}\`**`,
			KDR: ({ count }) => `KDR: **\`${count}%\`**`,
			MATCHES_PLAYED: ({ count }) => `Matches played: **\`${count}\`**`,
			TOP_1S: ({ count }) => `Top 1s: **\`${count}\`**`,
			TOP_3S: ({ count }) => `Top 3s: **\`${count}\`**`,
			TOP_5S: ({ count }) => `Top 5s: **\`${count}\`**`,
			TOP_6S: ({ count }) => `Top 6s: **\`${count}\`**`,
			TOP_10S: ({ count }) => `Top 10s: **\`${count}\`**`,
			TOP_12S: ({ count }) => `Top 12s: **\`${count}\`**`,
			TOP_25S: ({ count }) => `Top 25s: **\`${count}\`**`
		},
		COMMAND_OVERWATCH_DESCRIPTION: 'Gets player statistics for an Overwatch player',
		COMMAND_OVERWATCH_EXTENDED: {
			extendedHelp: `This command retrieves statistics for any Overwatch player that plays on PC, Xbox or Playstation.
				By default it will look at PC players, if you want to check for Xbox or Playstation players then set the platform
				to \`xbl\` or \`psn\` respectively.
				IMPORTANT: **Player names are case sensitive!**`,
			explainedUsage: [
				['platform', '(optional, defaults to `pc`) Platform the player plays on, one of `pc`, `xbl`, or `psn`'],
				['player', 'For PC the full blizzard tag, for console the username. Case sensitive!']
			],
			examples: ['MagicPants#112369', 'xbl Dorus NL gamer', 'psn decoda_24']
		},
		COMMAND_OVERWATCH_INVALID_PLAYER_NAME: ({ playerTag }) =>
			[
				`\`${playerTag}\` is an invalid player name`,
				'For PC it has to be their full Blizzard BattleTag, for example `MagicPants#112369`.',
				'For Xbox and Playstation it just has to be their username.'
			].join('\n'),
		COMMAND_OVERWATCH_QUERY_FAIL: ({ player, platform }) =>
			[
				`Failed to get data for \`${player}\`, are you sure they play on \`${platform}\`?`,
				'Also make sure to get the casing right, names are case sensitive.'
			].join('\n'),
		COMMAND_OVERWATCH_NO_STATS: ({ player }) => `I found a player with the tag \`${player}\` but no stats were available for them.`,
		COMMMAND_OVERWATCH_EMBED_DATA: {
			TITLE: 'Click here for more details on overwatchtracker.com',
			RATINGS_TITLE: 'Ratings',
			NO_AVERAGE: 'Not enough data to determine average.',
			AUTHOR: ({ name }) => `Overwatch Player Statistics for ${name}`,
			PLAYER_LEVEL: ({ level }) => `**Player level:** ${this.groupDigits(level)}`,
			PRESTIGE_LEVEL: ({ level }) => `**Prestige level:** ${this.groupDigits(level)}`,
			TOTAL_GAMES_WON: ({ gamesWon }) => `**Total games won:** ${gamesWon ? this.groupDigits(gamesWon) : 'None'}`,
			RATINGS: ({ ratings }) =>
				ratings
					.map(
						(rating) =>
							`**${toTitleCase(rating.role)}:** ${typeof rating.level === 'number' ? this.groupDigits(rating.level) : rating.level}`
					)
					.join('\n'),
			FINAL_BLOWS: ({ finalBlows }) => `**Final blows:** ${this.groupDigits(finalBlows)}`,
			DEATHS: ({ deaths }) => `**Deaths:** ${this.groupDigits(deaths)}`,
			DAMAGE_DEALT: ({ damageDone }) => `**Damage dealt:** ${this.groupDigits(damageDone)}`,
			HEALING: ({ healingDone }) => `**Healing:** ${this.groupDigits(healingDone)}`,
			OBJECTIVE_KILLS: ({ objectiveKills }) => `**Objective kills:** ${this.groupDigits(objectiveKills)}`,
			SOLO_KILLS: ({ soloKills }) => `**Solo kills:** ${this.groupDigits(soloKills)}`,
			PLAY_TIME: ({ timePlayed }) => `**Playtime:** ${this.duration(timePlayed, 2)}`,
			GAMES_WON: ({ gamesWon }) => `**Games won:** ${this.groupDigits(gamesWon)}`,
			GOLDEN_MEDALS: ({ medalsGold }) => `**Gold medals earned:** ${this.groupDigits(medalsGold)}`,
			SILVER_MEDALS: ({ medalsSilver }) => `**Silver medals earned:** ${this.groupDigits(medalsSilver)}`,
			BRONZE_MEDALS: ({ medalsBronze }) => `**Bronze medals earned:** ${this.groupDigits(medalsBronze)}`,
			TOP_HERO: ({ heroName, timePlayed }) => `**${toTitleCase(heroName)}** (${timePlayed})`,
			HEADERS: {
				ACCOUNT: '__Account Stats__',
				QUICKPLAY: '__Quickplay Stats__',
				COMPETITIVE: '__Competitive Stats__',
				TOP_HEROES_QUICKPLAY: '__Top Heroes Quickplay__',
				TOP_HEROES_COMPETITIVE: '__Top Heroes Competitive__'
			}
		},

		/**
		 * ################
		 * GENERAL COMMANDS
		 */

		COMMAND_SUPPORT_DESCRIPTION: 'Show support instructions',
		COMMAND_SUPPORT_EXTENDED: {
			extendedHelp: "This command gives you a link to *Skyra's Lounge*, the best place for everything related to me."
		},

		/**
		 * ###################
		 * MANAGEMENT COMMANDS
		 */

		COMMAND_CREATEMUTE_DESCRIPTION: 'Prepare the mute system.',
		COMMAND_CREATEMUTE_EXTENDED: {
			extendedHelp: `This command prepares the mute system by creating a role called 'muted', and configuring it to
					the guild settings. This command also modifies all channels (where possible) permissions and disables
					the permission **${PERMS.SEND_MESSAGES}** in text channels and **${PERMS.CONNECT}** in voice channels for said role.`
		},
		COMMAND_GIVEAWAY_DESCRIPTION: 'Start a new giveaway.',
		COMMAND_GIVEAWAY_EXTENDED: {
			extendedHelp: `This command is designed to manage giveaways. You can start them with this command by giving it the
					time and a title. When a giveaway has been created, Skyra will send a giveaway message and react to it with 🎉
					so the members of the server can participate on it. Once the timer ends, Skyra will retrieve all the users who
					reacted and send the owner of the giveaway a message in direct messages with the winner, and other 10 possible
					winners (in case of needing to re-roll).
					You can also pass a flag of \`--winners=Xw\`, wherein X is a number (for example 2w for 2 winners),
					to allow multiple people to win this giveaway.`,
			explainedUsage: [
				['channel', '(Optional) The channel in which to start the giveaway'],
				['time', 'The time the giveaway should last.'],
				['title', 'The title of the giveaway.']
			],
			examples: ['6h A hug from Skyra.', '60m 5w A mysterious Steam game', '1d Free Discord Nitro! --winners=2w']
		},
		COMMAND_GIVEAWAYREROLL_DESCRIPTION: 'Re-roll the winners from a giveaway.',
		COMMAND_GIVEAWAYREROLL_EXTENDED: {
			extendedHelp: `This command is designed to re-roll finished giveaways. Please check \`Skyra, help gstart\` for more information
					about creating one.`,
			explainedUsage: [
				['winners', 'The amount of winners to pick.'],
				['message', 'The message to target. Defaults to last giveaway message.']
			],
			examples: ['', '633939404745998346', '5', '5 633939404745998346']
		},
		COMMAND_GIVEAWAYSCHEDULE_DESCRIPTION: 'Schedule a giveaway to start at a certain time.',
		COMMAND_GIVEAWAYSCHEDULE_EXTENDED: {
			extendedHelp: `
				This command prepares a giveaway to start at a certain time if you do not wish to start it immediately.
				You can also pass a flag of \`--winners=X\`, wherein X is a number, to allow multiple people to win this giveaway..
			`,
			explainedUsage: [
				['channel', '(Optional) The channel in which to start the giveaway'],
				['schedule', 'The time to wait before starting the giveaway.'],
				['time', 'The time the giveaway should last.'],
				['title', 'The title of the giveaway.']
			],
			examples: ['30m 6h A hug from Skyra.']
		},

		/**
		 * ###################
		 * MANAGEMENT COMMANDS
		 */

		COMMAND_NICK_DESCRIPTION: "Change Skyra's nickname for this server.",
		COMMAND_NICK_EXTENDED: {
			extendedHelp: "This command allows you to change Skyra's nickname easily for the server.",
			reminder: `This command requires the **${PERMS.CHANGE_NICKNAME}** permission. Make sure Skyra has it.`,
			explainedUsage: [['nick', "The new nickname. If you don't put any, it'll reset it instead."]],
			examples: ['SkyNET', 'Assistant', '']
		},
		COMMAND_PERMISSIONNODES_DESCRIPTION: 'Configure the permission nodes for this server.',
		COMMAND_PERMISSIONNODES_EXTENDED: {
			extendedHelp: `Permission nodes are per-user and per-role overrides. They are used when the built-in permissions system is not enough.
					For example, in some servers they want to give a staff role the permissions to use mute and warn, but not ban and others (reserved
					to moderators), and only warn is available for the configurable staff-level permission, so you can tell me to allow the mute command
					for the staff role now.`,
			explainedUsage: [
				['action', 'Either `add`, `remove`, `reset`, or `show`. Defaults to `show`.'],
				['target', 'Either a role name or a user name, allowing IDs and mentions for either.'],
				['type', 'Either `allow` or `deny`. This is ignored when `action` is not `add` nor `remove`.'],
				['command', 'The name of the command to allow or deny. This is ignored when `action` is not `add` nor `remove`.']
			],
			examples: ['add staff allow warn', 'add moderators deny ban', 'remove staff allow warn', 'reset staff', 'show staff'],
			reminder: 'The server owner cannot have any actions, nor the `everyone` role can have allowed commands.'
		},
		COMMAND_TRIGGERS_DESCRIPTION: 'Set custom triggers for your guild!.',
		COMMAND_TRIGGERS_EXTENDED: {
			extendedHelp: `This command allows administrators to go further with the personalization of Skyra in the guild!. A trigger is
					a piece that can active other functions. For example, the aliases are triggers that get executed when the command does not
					exist in bot, triggering the unknown command event. When this happens, the alias system executes and tries to find an entry
					that matches with the input.`,
			reminder: `This command requires the **${PERMS.ADD_REACTIONS}** permission so it can test reactions. Make sure Skyra has it.`,
			explainedUsage: [
				['list', 'List all current triggers.'],
				['add <type> <input> <output>', 'Add a new trigger given a type, input and output.'],
				['remove <type> <input>', 'Remove a trigger given the type and input.']
			],
			examples: ['', 'list', 'add reaction "good night" 🌛', 'remove reaction "good night"']
		},

		/**
		 * #################################
		 * MANAGEMENT/CONFIGURATION COMMANDS
		 */

		COMMAND_MANAGECOMMANDAUTODELETE_DESCRIPTION: 'Manage per-channel autodelete timer.',
		COMMAND_MANAGECOMMANDAUTODELETE_EXTENDED: {
			extendedHelp:
				"This command manages this guild's per-channel command autodelete timer, it serves well to leave a channel clean from commands.",
			explainedUsage: [
				['show', 'Show the autodelete timer for all channels.'],
				['add [channel] <command>', 'Add an autodelete timer for the specified channel.'],
				['remove [channel]', 'Remove the autotimer from the specified channel.'],
				['reset', 'Clear all autodelete timers.']
			],
			reminder: "The channel argument is optional, defaulting to the message's channel, but it uses fuzzy search when possible.",
			examples: ['show', 'add #general 4s', 'remove #general', 'reset']
		},
		COMMAND_MANAGECOMMANDCHANNEL_DESCRIPTION: 'Manage per-channel command blacklist.',
		COMMAND_MANAGECOMMANDCHANNEL_EXTENDED: {
			extendedHelp: `This command manages this guild's per-channel command blacklist, it serves well to disable certain commands you do not want
					to be used in certain channels (to disable a command globally, use the \`disabledCommands\` settings key to disable in all channels.`,
			explainedUsage: [
				['show [channel]', 'Show the command blacklist for the selected channel.'],
				['add [channel] <command>', "Add a command to the specified channel's command blacklist."],
				['remove [channel] <command>', "Remove a command to the specified channel's command blacklist."],
				['reset [channel]', 'Clear the command blacklist for the specified channel.']
			],
			reminder: 'The channel argument is optional, but it uses fuzzy search when possible.',
			examples: ['show', 'add #general profile', 'remove #general profile', 'reset #general']
		},
		COMMAND_MANAGEREACTIONROLES_DESCRIPTION: 'Manage the reaction roles for this server.',
		COMMAND_MANAGEREACTIONROLES_EXTENDED: {
			extendedHelp: `Seamlessly set up reaction roles in your server! When adding reaction roles, I listen to your reactions for 5 minutes and I bind
				the first reaction from you alongside the channel and the message, with the specified role. Otherwise, if a channel is specified, a prompt will
				not be created, and the reaction role will be bound to all of the channel's messages.`,
			explainedUsage: [
				['show', 'Retrieve the list of all reaction roles.'],
				['add <role>', 'Adds a reaction role binding the first reacted message since the execution with the role.'],
				['remove <role> <message>', 'Removes a reaction role, use `show` to get a list of them.'],
				['reset', 'Removes all reaction roles.']
			]
		},
		COMMAND_SETIGNORECHANNELS_DESCRIPTION: 'Set a channel to the ignore channel list.',
		COMMAND_SETIGNORECHANNELS_EXTENDED: {
			extendedHelp: `This command helps you setting up ignored channels. An ignored channel is a channel where nobody but moderators
					can use Skyra's commands. Unlike removing the **${PERMS.SEND_MESSAGES}** permission, Skyra is still able to send (and therefore
					execute commands) messages, which allows moderators to use moderation commands in the channel. Use this if you want to ban
					any command usage from the bot in a specific channel.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			reminder: 'You cannot set the same channel twice, instead, Skyra will remove it.',
			examples: ['#general', 'here']
		},
		COMMAND_SETIMAGELOGS_DESCRIPTION: 'Set the image logs channel.',
		COMMAND_SETIMAGELOGS_EXTENDED: {
			extendedHelp: `This command helps you setting up the image log channel. Whenever a member sends an image attachment, it will send an embed message with
					the attachment re-uploaded. All messages are in embeds so you will need to enable the permission **${PERMS.EMBED_LINKS}** for Skyra.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			examples: ['#image-logs', 'here']
		},
		COMMAND_SETMEMBERLOGS_DESCRIPTION: 'Set the member logs channel.',
		COMMAND_SETMEMBERLOGS_EXTENDED: {
			extendedHelp: `This command helps you setting up the member log channel. A member log channel only sends two kinds of logs: "Member Join" and
					"Member Leave". If a muted user joins, it will send a special "Muted Member Join" event. All messages are in embeds so you will need to enable
					the permission **${PERMS.EMBED_LINKS}** for Skyra. You also need to individually set the "events" you want to listen: "events.memberAdd" and
					"events.memberRemove". For roles, you would enable "events.memberNicknameChange" and/or "events.memberRoleUpdate" via the "config" command.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			examples: ['#member-logs', 'here']
		},
		COMMAND_SETMESSAGELOGS_DESCRIPTION: 'Set the message logs channel.',
		COMMAND_SETMESSAGELOGS_EXTENDED: {
			extendedHelp: `This command helps you setting up the message log channel. A message log channel only sends three kinds of logs: "Message Delete",
					"Message Edit", and "Message Prune". All messages are in embeds so you will need to enable the permission **${PERMS.EMBED_LINKS}** for Skyra. You
					also need to individually set the "events" you want to listen: "events.messageDelete" and "events.messageEdit" via the
					"config" command.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			reminder: `Due to Discord limitations, Skyra cannot know who deleted a message. The only way to know is by fetching audit logs, requiring the
				permission **${PERMS.VIEW_AUDIT_LOG}** which access is limited in the majority of guilds and the amount of times I can fetch them in a period of time.`,
			examples: ['#message-logs', 'here']
		},
		COMMAND_SETMODLOGS_DESCRIPTION: 'Set the mod logs channel.',
		COMMAND_SETMODLOGS_EXTENDED: {
			extendedHelp: `This command helps you setting up the mod log channel. A mod log channel only sends case reports indexed by a number case and with
					"claimable" reasons and moderators. This channel is not a must and you can always retrieve specific modlogs with the "case" command. All
					messages are in embeds so you will need to enable the permission **${PERMS.EMBED_LINKS}** for Skyra. For auto-detection, you need to individually
					set the "events" you want to listen: "events.banAdd", "events.banRemove" via the "config" command.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			reminder: `Due to Discord limitations, the auto-detection does not detect kicks. You need to use the "kick" command if you want to document them as
				a formal moderation log case.`,
			examples: ['#mod-logs', 'here']
		},
		COMMAND_SETPREFIX_DESCRIPTION: "Set Skyra's prefix.",
		COMMAND_SETPREFIX_EXTENDED: {
			extendedHelp: `This command helps you setting up Skyra's prefix. A prefix is an affix that is added in front of the word, in this case, the message.
					It allows bots to distinguish between a regular message and a command. By nature, the prefix between should be different to avoid conflicts. If
					you forget Skyra's prefix, simply mention her with nothing else and she will tell you the current prefix. Alternatively, you can take advantage
					of Skyra's NLP (Natural Language Processing) and prefix the commands with her name and a comma. For example, "Skyra, ping".`,
			explainedUsage: [['prefix', `The prefix to set. Default one in Skyra is "${this.client.options.prefix}".`]],
			reminder: 'Your prefix should only contain characters everyone can write and type.',
			examples: ['&', '=']
		},
		COMMAND_SETROLECHANNEL_DESCRIPTION: 'Set the role channel for role reactions.',
		COMMAND_SETROLECHANNEL_EXTENDED: {
			extendedHelp: `This command sets up the role channel to lock the reactions to, it is a requirement to set up before setting up the **role message**,
					and if none is given, the role reactions module will not run.`,
			explainedUsage: [
				[
					'channel',
					'A TextChannel. You can either put the name of the channel, tag it, or type in "here" to select the channel the message was sent.'
				]
			],
			reminder: 'You cannot set the same channel twice, instead, Skyra will remove it.',
			examples: ['#roles', 'here']
		},
		COMMAND_SETROLEMESSAGE_DESCRIPTION: 'Set the role message for role reactions.',
		COMMAND_SETROLEMESSAGE_EXTENDED: {
			extendedHelp: `This command sets up the role message to lock the reactions to, it requires a **role channel** to be set up first, and if none is given,
					Skyra will listen to any reaction in the channel. Additionally, Skyra requires **${PERMS.READ_MESSAGE_HISTORY}** in order to fetch the message for
					validation.`,
			explainedUsage: [['message', 'An ID, they are 17-18 characters long and numeric.']],
			reminder: 'You must execute this command in the role channel.',
			examples: ['434096799847022598']
		},
		COMMAND_SETSTARBOARDEMOJI_DESCRIPTION: 'Set the emoji reaction for starboard.',
		COMMAND_SETSTARBOARDEMOJI_EXTENDED: {
			extendedHelp: `This command sets up the starboard emoji for the starboard, which is, by default, ⭐. Once this is changed, Skyra will ignore any star and
					will count users who reacted to said emoji.`,
			explainedUsage: [['emoji', 'The emoji to set.']],
			reminder: 'Use this wisely, not everyone expects the starboard to listen to a custom emoji.',
			examples: ['⭐']
		},

		/**
		 * #################
		 * GIVEAWAY COMMANDS
		 */

		COMMAND_GIVEAWAYREROLL_INVALID: 'The message ID does not exist or there is no finished giveaway.',

		/**
		 * ###########################
		 * MANAGEMENT/HELPERS COMMANDS
		 */

		COMMAND_ROLEINFO_DESCRIPTION: 'Check the information for a role.',
		COMMAND_ROLEINFO_EXTENDED: {
			extendedHelp: `The roleinfo command displays information for a role, such as its id, name, color, whether it's hoisted
					(displays separately) or not, it's role hierarchy position, whether it's mentionable or not, how many members have said
					role, and its permissions. It sends an embedded message with the color of the role.`,
			explainedUsage: [['role', 'The role name, partial name, mention or id.']],
			examples: ['Administrator', 'Moderator', '']
		},
		COMMAND_GUILDINFO_DESCRIPTION: 'Check the information of the guild!.',
		COMMAND_GUILDINFO_EXTENDED: {
			extendedHelp: `The serverinfo command displays information for the guild the message got sent. It shows the amount of channels,
					with the count for each category, the amount of members (given from the API), the owner with their user id, the amount of roles,
					region, creation date, verification level... between others.`
		},

		/**
		 * ###########################
		 * MANAGEMENT/MEMBERS COMMANDS
		 */

		COMMAND_STICKYROLES_DESCRIPTION: 'Manage sticky roles for users.',
		COMMAND_STICKYROLES_EXTENDED: {
			extendedHelp: `The stickyRoles command allows you to manage per-member's sticky roles, they are roles that are kept even when
				you leave, and are applied back as soon as they join.`,
			explainedUsage: [
				['action', 'Either you want to check the sticky roles, add one, remove one, or remove all of them.'],
				['user', 'The user target for all the actions.'],
				['role', 'The role to add or remove.']
			],
			examples: ['add Skyra Goddess', 'show Skyra', 'remove Skyra Goddess', 'reset Skyra'],
			reminder: "The member's roles will not be modified by this command, you need to add or remove them."
		},

		/**
		 * #####################################
		 * MANAGEMENT/ATTACHMENT FILTER COMMANDS
		 */

		COMMAND_MANAGEATTACHMENTS_DESCRIPTION: 'Manage attachment management in this guild!.',
		COMMAND_MANAGEATTACHMENTS_EXTENDED: {
			extendedHelp: 'This command manages the attachment management for me in this guild!.',
			examples: ['maximum 25', 'duration 1m', 'action mute', 'logs y', 'enable', 'disable'],
			explainedUsage: [
				['maximum <maximum>', 'The maximum amount of attachments allowed.'],
				['duration <duration>', 'The lifetime for the attachments in the system.'],
				['action <ban|kick|mute|softban>', 'Defines the action I will take once a user breaks the threshold.'],
				['logs <y|yes|n|no>', 'Defines whether or not should I log when somebody breaks the threshold.'],
				['enable', 'Enables the attachment filter.'],
				['disable', 'Disables the attachment filter.']
			]
		},

		/**
		 * ##################################
		 * MANAGEMENT/MESSAGE FILTER COMMANDS
		 */

		COMMAND_CAPITALSMODE_DESCRIPTION: "Manage this guild's flags for the caps filter.",
		COMMAND_CAPITALSMODE_EXTENDED: {
			extendedHelp: `The capitalsMode command manages the behavior of the caps system.
				The minimum amount of characters before filtering can be set with \`Skyra, settings set selfmod.capitals.minimum <number>\`.
				The percentage of uppercase letters can be set with \`Skyra, settings set selfmod.capitals.maximum <number>\`.`,
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			],
			multiline: true
		},
		COMMAND_FILTER_DESCRIPTION: "Manage this guild's word blacklist.",
		COMMAND_FILTER_EXTENDED: {
			extendedHelp: `The filter command manages the word blacklist for this server and must have a filter mode set up, check \`Skyra, help filterMode\`.
					Skyra's word filter can find matches even with special characters or spaces between the letters of a blacklisted word, as well as it filters
					duplicated characters for enhanced filtering.`
		},
		COMMAND_FILTERMODE_DESCRIPTION: "Manage this server's word filter modes.",
		COMMAND_FILTERMODE_EXTENDED: {
			extendedHelp: `The filterMode command manages the behavior of the word filter system.
				Run \`Skyra, help filter\` for how to add words.`,
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},
		COMMAND_INVITEMODE_DESCRIPTION: 'Manage the behavior for the invite link filter.',
		COMMAND_INVITEMODE_EXTENDED: {
			extendedHelp: 'The inviteMode command manages the behavior of the word filter system.',
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},
		COMMAND_LINKMODE_DESCRIPTION: 'Manage the behavior for the link filter.',
		COMMAND_LINKMODE_EXTENDED: {
			extendedHelp: 'The linkMode command manages the behavior of the link system.',
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},
		COMMAND_MESSAGEMODE_DESCRIPTION: 'Manage the behavior for the message filter system.',
		COMMAND_MESSAGEMODE_EXTENDED: {
			extendedHelp: 'The messageMode command manages the behavior of the message filter system.',
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},
		COMMAND_NEWLINEMODE_DESCRIPTION: 'Manage the behavior for the new line filter system.',
		COMMAND_NEWLINEMODE_EXTENDED: {
			extendedHelp: `The newLineMode command manages the behavior of the new line filter system.
				The maximum amount of lines allowed can be set with \`Skyra, settings set selfmod.newlines.maximum <number>\``,
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},
		COMMAND_REACTIONMODE_DESCRIPTION: 'Manage the behavior for the reaction filter system.',
		COMMAND_REACTIONMODE_EXTENDED: {
			extendedHelp: 'The reactionMode command manages the behavior of the reaction filter system.',
			explainedUsage: [
				['Enable', 'Enable the sub-system.'],
				['Disable', 'Disable the sub-system'],
				['Action Alert', 'Toggle message alerts in the channel.'],
				['Action Log', 'Toggle message logs in the moderation logs channel.'],
				['Action Delete', 'Toggle message deletions.'],
				['Punishment', 'The moderation action to take, takes any of `none`, `warn`, `kick`, `mute`, `softban`, or `ban`.'],
				['Punishment-Duration', 'The duration for the punishment, only applicable to `mute` and `ban`. Takes a duration.'],
				[
					'Threshold-Maximum',
					'The amount of infractions that can be done within `Threshold-Duration` before taking action, instantly if unset. Takes a number.'
				],
				['Threshold-Duration', 'The time in which infractions will accumulate before taking action, instantly if unset. Takes a duration.']
			],
			reminder: '`Action Log` requires `channel.moderation-logs` to be set up.',
			examples: [
				'enable',
				'disable',
				'action alert',
				'punishment ban',
				'punishment mute',
				'punishment-duration 1m',
				'threshold-maximum 5',
				'threshold-duration 30s'
			]
		},

		/**
		 * #############
		 * MISC COMMANDS
		 */

		COMMAND_CUDDLE_DESCRIPTION: 'Cuddle somebody!',
		COMMAND_CUDDLE_EXTENDED: {
			extendedHelp: `Do you know something that I envy from humans? The warm feeling when somebody cuddles you. It's so cute ❤! I can
				imagine and draw a image of you cuddling somebody in the bed, I hope you like it!`,
			explainedUsage: [['user', 'The user to cuddle with.']],
			examples: ['Skyra']
		},
		COMMAND_DELETTHIS_DESCRIPTION: '*Sees offensive post* DELETTHIS!',
		COMMAND_DELETTHIS_EXTENDED: {
			extendedHelp: `I see it! I see the hammer directly from your hand going directly to the user you want! Unless... unless it's me! If
				you try to tell me this, I'm going to take the MJOLNIR! Same if you do with my creator!`,
			explainedUsage: [['user', 'The user that should start deleting his post.']],
			examples: ['John Doe']
		},
		COMMAND_F_DESCRIPTION: 'Press F to pay respects.',
		COMMAND_F_EXTENDED: {
			extendedHelp: `This command generates an image... to pay respects reacting with 🇫. This command also makes Skyra
				react the image if she has permissions to react messages.`,
			explainedUsage: [['user', 'The user to pray respects to.']],
			examples: ['John Doe', 'Jake']
		},
		COMMAND_GOODNIGHT_DESCRIPTION: 'Give somebody a nice Good Night!',
		COMMAND_GOODNIGHT_EXTENDED: {
			extendedHelp: "Let me draw you giving a goodnight kiss to the person who is going to sleep! Who doesn't like goodnight kisses?",
			explainedUsage: [['user', 'The user to give the goodnight kiss.']],
			examples: ['Jake', 'DefinitivelyNotSleeping']
		},
		COMMAND_GOOFYTIME_DESCRIPTION: "It's Goofy time!",
		COMMAND_GOOFYTIME_EXTENDED: {
			extendedHelp: `IT'S GOOFY TIME! *Screams loudly in the background* NO, DAD! NO! This is a command based on the Goofy Time meme,
					what else would it be?`,
			explainedUsage: [['user', "The user who will say IT'S GOOFY TIME!"]],
			examples: ['TotallyNotADaddy']
		},
		COMMAND_HUG_DESCRIPTION: 'Hugs!',
		COMMAND_HUG_EXTENDED: {
			extendedHelp: `What would be two people in the middle of the snow with coats and hugging each other? Wait! I get it!
				Mention somebody you want to hug with, and I'll try my best to draw it in a canvas!`,
			explainedUsage: [['user', 'The user to hug with.']],
			examples: ['Bear']
		},
		COMMAND_INEEDHEALING_DESCRIPTION: "*Genji's voice* I NEED HEALING!",
		COMMAND_INEEDHEALING_EXTENDED: {
			extendedHelp: `Do you know the worst nightmare for every single healer in Overwatch, specially for Mercy? YES! You know it,
				it's a cool cyborg ninja that looks like a XBOX and is always yelling "I NEED HEALING" loudly during the entire match.
				Well, don't expect so much, this command actually shows a medic with some tool in your chest.`,
			explainedUsage: [['healer', 'The healer you need to heal you.']],
			examples: ['Mercy']
		},
		COMMAND_RANDREDDIT_DESCRIPTION: 'Retrieve a random Reddit post.',
		COMMAND_RANDREDDIT_EXTENDED: {
			extendedHelp: 'This is actually something like a Russian Roulette, you can get a good meme, but you can also get a terrible meme.',
			explainedUsage: [['reddit', 'The reddit to look at.']],
			examples: ['discordapp']
		},
		COMMAND_REDDITUSER_DESCRIPTION: 'Retrieve statistics for a Reddit user.',
		COMMAND_REDDITUSER_EXTENDED: {
			extendedHelp: 'Gets statistics of any given Reddit user',
			explainedUsage: [['user', 'The reddit user to look at.']],
			examples: ['GloriousGe0rge']
		},
		COMMAND_SHIP_DESCRIPTION: 'Ships 2 members',
		COMMAND_SHIP_EXTENDED: {
			extendedHelp: `
				This commands generates a ship name between two users and creates more love in the world.
				Users are optional, you can provide none, just one or both users. For any non-provided users I will pick a random guild member.
			`,
			explainedUsage: [
				['firstUser', 'The first user to ship'],
				['secondUser', 'The second user to ship']
			],
			examples: ['romeo juliet'],
			reminder: 'If I cannot find either given user then I will pick someone randomly.'
		},
		COMMAND_SHIP_DATA: {
			TITLE: ({ romeoUsername, julietUsername }) => `**Shipping \`${romeoUsername}\` and \`${julietUsername}\`**`,
			DESCRIPTION: ({ shipName }) => `I call it... ${shipName}`
		},
		COMMAND_CHASE_DESCRIPTION: 'Get in here!',
		COMMAND_CHASE_EXTENDED: {
			extendedHelp: 'Do you love chasing? Start chasing people now for free! Just mention or write their ID and done!',
			explainedUsage: [['pinger', 'The user who you want to chase.']],
			examples: ['IAmInnocent']
		},
		COMMAND_SHINDEIRU_DESCRIPTION: 'Omae wa mou shindeiru.',
		COMMAND_SHINDEIRU_EXTENDED: {
			extendedHelp: `"You are already dead" Japanese: お前はもう死んでいる; Omae Wa Mou Shindeiru, is an expression from the manga
				and anime series Fist of the North Star. This shows a comic strip of the character pronouncing the aforementioned words,
				which makes the opponent reply with "nani?" (what?).`,
			explainedUsage: [['user', "The person you're telling that phrase to."]],
			examples: ['Jack']
		},
		COMMAND_PEEPOLOVE_DESCRIPTION: "Generates a peepoLove image from a users' avatar.",
		COMMAND_PEEPOLOVE_EXTENDED: {
			extendedHelp: `Allows you to generate a peepoLove image from a user's avatar.`,
			explainedUsage: [['user', 'The user that peepo should hug.']],
			examples: ['Joe'],
			reminder: 'Custom image support has been temporarily disabled, ETA on it being back is roughly November 2020'
		},
		COMMAND_SLAP_DESCRIPTION: 'Slap another user using the Batman & Robin Meme.',
		COMMAND_SLAP_EXTENDED: {
			extendedHelp: 'The hell are you saying? *Slaps*. This meme is based on a comic from Batman and Robin.',
			explainedUsage: [['user', 'The user you wish to slap.']],
			examples: ['Jake'],
			reminder: "You try to slap me and I'll slap you instead."
		},
		COMMAND_SNIPE_DESCRIPTION: 'Retrieve the last deleted message from a channel',
		COMMAND_SNIPE_EXTENDED: {
			extendedHelp: `This just sends the last deleted message from this channel, somebody is misbehaving? This will
				catch them.`
		},
		COMMAND_THESEARCH_DESCRIPTION: 'Are we the only one in the universe, this man on earth probably knows.',
		COMMAND_THESEARCH_EXTENDED: {
			extendedHelp: 'One man on Earth probably knows if there is intelligent life, ask and you shall receive an answer.',
			explainedUsage: [['answer', 'The sentence that will reveal the truth.']],
			examples: ['Your waifu is not real.']
		},
		COMMAND_TRIGGERED_DESCRIPTION: 'I am getting TRIGGERED!',
		COMMAND_TRIGGERED_EXTENDED: {
			extendedHelp: `What? My commands are not enough userfriendly?! (╯°□°）╯︵ ┻━┻. This command generates a GIF image
					your avatar wiggling fast, with a TRIGGERED footer, probably going faster than I thought, I don't know.`,
			explainedUsage: [['user', 'The user that is triggered.']],
			examples: ['kyra']
		},
		COMMAND_UPVOTE_DESCRIPTION: 'Get a link to upvote Skyra in **Bots For Discord**',
		COMMAND_UPVOTE_EXTENDED: {
			extendedHelp: `Bots For Discord is a website where you can find amazing bots for your website. If you really love me,
					you can help me a lot by upvoting me every 24 hours, so more users will be able to find me!`
		},
		COMMAND_VAPORWAVE_DESCRIPTION: 'Vapowave characters!',
		COMMAND_VAPORWAVE_EXTENDED: {
			extendedHelp: `Well, what can I tell you? This command turns your messages into unicode monospaced characters. That
					is, what humans call 'Ａ Ｅ Ｓ Ｔ Ｈ Ｅ Ｔ Ｉ Ｃ'. I wonder what it means...`,
			explainedUsage: [['phrase', 'The phrase to convert']],
			examples: ['A E S T H E T I C']
		},

		/**
		 * ##############################
		 * MODERATION/MANAGEMENT COMMANDS
		 */

		COMMAND_HISTORY_DESCRIPTION: 'Display the count of moderation cases from this guild or from a user.',
		COMMAND_HISTORY_EXTENDED: {
			extendedHelp: `This command shows the amount of bans, mutes, kicks, and warnings, including temporary, that have not been
					appealed.`,
			examples: ['', '@Pete']
		},
		COMMAND_HISTORY_FOOTER: ({ warnings, mutes, kicks, bans }) =>
			`This user has ${warnings} ${warnings === 1 ? 'warning' : 'warnings'}, ${mutes} ${mutes === 1 ? 'mute' : 'mutes'}, ${kicks} ${
				kicks === 1 ? 'kick' : 'kicks'
			}, ${bans} ${bans === 1 ? 'ban' : 'bans'}.`,
		COMMAND_MODERATIONS_DESCRIPTION: 'List all running moderation logs from this guild.',
		COMMAND_MODERATIONS_EXTENDED: {
			extendedHelp: `This command shows you all the temporary moderation actions that are still running. This command uses a
					reaction-based menu and requires the permission **${PERMS.MANAGE_MESSAGES}** to execute correctly.`,
			examples: ['', '@Pete', 'mutes @Pete', 'warnings']
		},
		COMMAND_MODERATIONS_EMPTY: 'Nobody has behaved badly yet, who will be the first user to be listed here?',
		COMMAND_MODERATIONS_AMOUNT: ({ amount }) => (amount === 1 ? 'There is 1 entry.' : `There are ${amount} entries.`),
		COMMAND_MUTES_DESCRIPTION: 'List all mutes from this guild or from a user.',
		COMMAND_MUTES_EXTENDED: {
			extendedHelp: `This command shows either all mutes filed in this guild, or all mutes filed in this guild
					for a specific user. This command uses a reaction-based menu and requires the permission **${PERMS.MANAGE_MESSAGES}**
					to execute correctly.`,
			examples: ['', '@Pete']
		},
		COMMAND_WARNINGS_DESCRIPTION: 'List all warnings from this guild or from a user.',
		COMMAND_WARNINGS_EXTENDED: {
			extendedHelp: `This command shows either all warnings filed in this guild, or all warnings filed in this guild
					for a specific user. This command uses a reaction-based menu and requires the permission **${PERMS.MANAGE_MESSAGES}**
					to execute correctly.`,
			examples: ['', '@Pete']
		},

		/**
		 * #############################
		 * MODERATION/UTILITIES COMMANDS
		 */

		COMMAND_ARCHIVE_DESCRIPTION: '[BETA] Temporarily save all messages from the current channel.',
		COMMAND_ARCHIVE_EXTENDED: {
			extendedHelp: `The archive command fetches multiple messages from a channel with an optional filter. How does
					this command work? First, I fetch all the messages, apply the filter, and then it's when the magic happens,
					I make a "message gist", to respect End-User Data policies, all of this is encrypted and the gist requires
					a key to unlock so you can read the contents. You unlock and read the contents from the website.`,
			explainedUsage: [
				['Messages', 'The amount of messages to archive.'],
				['Filter', 'The filter to apply.'],
				['(Filter) Link', 'Filters messages that have links on the content.'],
				['(Filter) Invite', 'Filters messages that have invite links on the content.'],
				['(Filter) Bots', 'Filters messages sent by bots.'],
				['(Filter) You', 'Filters messages sent by Skyra.'],
				['(Filter) Me', 'Filters your messages.'],
				['(Filter) Upload', 'Filters messages that have attachments.'],
				['(Filter) User', 'Filters messages sent by the specified user.']
			],
			examples: ['50 me', '75 @kyra', '20 bots'],
			reminder: 'Message gists last 30 days, after that, they are deleted, you also need the encryption key.'
		},
		COMMAND_CASE_DESCRIPTION: 'Get the information from a case given its index.',
		COMMAND_CASE_EXTENDED: {
			extendedHelp: ''
		},
		COMMAND_SLOWMODE_DESCRIPTION: "Set the channel's slowmode value in seconds.",
		COMMAND_SLOWMODE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_CHANNELS}** and will modify the channel's ratelimit per
					user to any value between 0 and 120 seconds.`,
			examples: ['0', 'reset', '4'],
			reminder: "To reset a channel's ratelimit per user, you can use either 0 or 'reset'."
		},

		/**
		 * ###################
		 * MODERATION COMMANDS
		 */

		COMMAND_BAN_DESCRIPTION: 'Hit somebody with the ban hammer.',
		COMMAND_BAN_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.BAN_MEMBERS}**, and only members with lower role hierarchy position
					can be banned by me. No, the guild's owner cannot be banned. This action can be optionally timed to create
					a temporary ban.`,
			examples: ['@Pete', '@Pete Spamming all channels.', '@Pete Spamming all channels, for 24 hours.']
		},
		COMMAND_DEHOIST_DESCRIPTION: 'Shoot everyone with the dehoist-inator 3000',
		COMMAND_DEHOIST_EXTENDED: {
			extendedHelp: `The act of hoisting involves adding special characters in front of your nickname
			in order to appear higher in the members list. This command replaces any member's nickname that includes those special characters
			with a special character that drags them to the bottom of the list.`,
			reminder: `This command requires **${PERMS.MANAGE_NICKNAMES}**, and only members with lower role hierarchy position
			can be dehoisted.`
		},
		COMMAND_KICK_DESCRIPTION: 'Hit somebody with the 👢.',
		COMMAND_KICK_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.KICK_MEMBERS}**, and only members with lower role hierarchy position
					can be kicked by me. No, the guild's owner cannot be kicked.`,
			examples: ['@Sarah', '@Sarah Spamming general chat.']
		},
		COMMAND_LOCKDOWN_DESCRIPTION: 'Close the gates for this channel!',
		COMMAND_LOCKDOWN_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_CHANNELS}** in order to be able to manage the permissions for
					a channel. This command removes the permission **${PERMS.SEND_MESSAGES}** to the \`@everyone\` role so nobody but
					the members with roles that have their own overrides (besides administrators, who bypass channel overrides) can
					send messages. Optionally, you can pass time as second argument.`,
			examples: ['', '#general', '#general 5m']
		},
		COMMAND_MUTE_DESCRIPTION: 'Mute a user in all text and voice channels.',
		COMMAND_MUTE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be muted. This action can be optionally timed to create
					a temporary mute. This action saves a member's roles temporarily and will be granted to the user after the unmute.
					The muted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Alphonse', '@Alphonse Spamming all channels', '@Alphonse 24h Spamming all channels']
		},
		COMMAND_SETNICKNAME_DESCRIPTION: 'Change the nickname of a user.',
		COMMAND_SETNICKNAME_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_NICKNAMES}**, and only members with lower role hierarchy position
						can be managed by me. No, the guild's owner nickname cannot be changed.`,
			examples: ['@Pete peeehteeerrr', '@ꓑ𝗲੮ẻ Pete Unmentionable name']
		},
		COMMAND_ADDROLE_DESCRIPTION: 'Adds a role to a user.',
		COMMAND_ADDROLE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
						can be managed by me. No, the guild's owner roles cannot be changed.`,
			examples: ['@John member', '@John member Make John a member']
		},
		COMMAND_REMOVEROLE_DESCRIPTION: '',
		COMMAND_REMOVEROLE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
						can be managed by me. No, the guild's owner roles cannot be changed.`,
			examples: ['@Paula member', '@Paula member Remove member permissions from Paula']
		},
		COMMAND_PRUNE_DESCRIPTION: 'Prunes a certain amount of messages w/o filter.',
		COMMAND_PRUNE_EXTENDED: {
			extendedHelp: `This command deletes the given amount of messages given a filter within the last 100 messages sent
					in the channel the command has been run. Optionally, you can add \`--silent\` to tell Skyra not to send a
					response message.`,
			explainedUsage: [
				['Messages', 'The amount of messages to prune.'],
				['Filter', 'The filter to apply.'],
				['(Filter) Link', 'Filters messages that have links on the content.'],
				['(Filter) Invite', 'Filters messages that have invite links on the content.'],
				['(Filter) Bots', 'Filters messages sent by bots.'],
				['(Filter) You', 'Filters messages sent by Skyra.'],
				['(Filter) Me', 'Filters your messages.'],
				['(Filter) Upload', 'Filters messages that have attachments.'],
				['(Filter) User', 'Filters messages sent by the specified user.']
			],
			examples: ['50 me', '75 @kyra', '20 bots', '60 humans before 629992398700675082'],
			reminder: 'Due to a Discord limitation, bots cannot delete messages older than 14 days.'
		},
		COMMAND_REASON_DESCRIPTION: 'Edit the reason field from a moderation log case.',
		COMMAND_REASON_EXTENDED: {
			extendedHelp: `This command allows moderation log case management, it allows moderators to update the reason.
						If you want to modify multiple cases at once you provide a range.
						For example \`1..3\` for the \`<range>\` will edit cases 1, 2, and 3.
						Alternatively you can also give ranges with commas:
						\`1,3..6\` will result in cases 1, 3, 4, 5, and 6
						\`1,2,3\` will result in cases 1, 2, and 3`,
			examples: ['420 Spamming all channels', '419..421 Bad memes', '1..3,4,7..9 Posting NSFW', 'latest Woops, I did a mistake!']
		},
		COMMAND_RESTRICTATTACHMENT_DESCRIPTION: 'Restrict a user from sending attachments in all channels.',
		COMMAND_RESTRICTATTACHMENT_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be restricted. This action can be optionally timed to create
					a temporary restriction.
					The restricted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Pete', '@Pete Sending weird images', '@Pete 24h Sending NSFW images']
		},
		COMMAND_RESTRICTEMBED_DESCRIPTION: 'Restrict a user from attaching embeds in all channels.',
		COMMAND_RESTRICTEMBED_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be restricted. This action can be optionally timed to create
					a temporary restriction.
					The restricted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Pete', '@Pete Sending weird links', '@Pete 24h Posted a spam link']
		},
		COMMAND_RESTRICTEMOJI_DESCRIPTION: 'Restrict a user from using external emojis in all channels.',
		COMMAND_RESTRICTEMOJI_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be restricted. This action can be optionally timed to create
					a temporary restriction.
					The restricted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Pete', '@Pete Spamming external emojis', '@Pete 24h Posted cringe'],
			reminder: `This will only prevent the usage of external emojis and so will have no effect for non-nitro users,
			your own server's emojis and regular build in twemojis can still be used by members with this role.`
		},
		COMMAND_RESTRICTREACTION_DESCRIPTION: 'Restrict a user from reacting to messages in all channels.',
		COMMAND_RESTRICTREACTION_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be restricted. This action can be optionally timed to create
					a temporary restriction.
					The restricted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Pete', '@Pete Spamming reactions', '@Pete 24h Posting weird reactions']
		},
		COMMAND_RESTRICTVOICE_DESCRIPTION: 'Restrict a user from joining any voice channel.',
		COMMAND_RESTRICTVOICE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}**, and only members with lower role hierarchy position
					can be managed by me. No, the guild's owner cannot be restricted. This action can be optionally timed to create
					a temporary restriction.
					The restricted role is **sticky**, if the user tries to remove it by rejoining the guild, it will be added back.`,
			examples: ['@Pete', '@Pete Earraping in general voice channels', '@Pete 24h Making weird noises']
		},
		COMMAND_SOFTBAN_DESCRIPTION: 'Hit somebody with the ban hammer, destroying all their messages for some days, and unban it.',
		COMMAND_SOFTBAN_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.BAN_MEMBERS}**, and only members with lower role hierarchy position
					can be banned by me. No, the guild's owner cannot be banned. The ban feature from Discord has a feature that
					allows the moderator to remove all messages from all channels that have been sent in the last 'x' days, being
					a number between 0 (no days) and 7. The user gets unbanned right after the ban, so it is like a kick, but
					that can prune many many messages.`,
			examples: ['@Pete', '@Pete Spamming all channels', '@Pete 7 All messages sent in 7 are gone now, YEE HAH!']
		},
		COMMAND_TOGGLEMODERATIONDM_DESCRIPTION: 'Toggle moderation DMs.',
		COMMAND_TOGGLEMODERATIONDM_EXTENDED: {
			extendedHelp: `This command allows you to toggle moderation DMs. By default, they are on, meaning that any moderation
					action (automatic or manual) will DM you, but you can disable them with this command.`,
			examples: ['']
		},
		COMMAND_UNBAN_DESCRIPTION: 'Unban somebody from this guild!.',
		COMMAND_UNBAN_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.BAN_MEMBERS}**. It literally gets somebody from the rubbish bin,
					cleans them up, and allows the pass to this guild's gates.`,
			examples: ['@Pete', '@Pete Turns out he was not the one who spammed all channels ¯\\_(ツ)_/¯']
		},
		COMMAND_UNMUTE_DESCRIPTION: 'Remove the scotch tape from a user.',
		COMMAND_UNMUTE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the muted people's list,
					and gives the old roles back if the user had them.`,
			examples: ['@Pete', '@Pete (Insert random joke here).']
		},
		COMMAND_UNRESTRICTATTACHMENT_DESCRIPTION: 'Remove the attachment restriction from one or more users.',
		COMMAND_UNRESTRICTATTACHMENT_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the restricted people's list.`,
			examples: ['@Pete']
		},
		COMMAND_UNRESTRICTEMBED_DESCRIPTION: 'Remove the embed restriction from one or more users.',
		COMMAND_UNRESTRICTEMBED_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the restricted people's list.`,
			examples: ['@Pete']
		},
		COMMAND_UNRESTRICTEMOJI_DESCRIPTION: 'Remove the external emoji restriction from one or more users.',
		COMMAND_UNRESTRICTEMOJI_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the restricted people's list.`,
			examples: ['@Pete']
		},
		COMMAND_UNRESTRICTREACTION_DESCRIPTION: 'Remove the reaction restriction from one or more users.',
		COMMAND_UNRESTRICTREACTION_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the restricted people's list.`,
			examples: ['@Pete']
		},
		COMMAND_UNRESTRICTVOICE_DESCRIPTION: 'Remove the voice restriction from one or more users.',
		COMMAND_UNRESTRICTVOICE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MANAGE_ROLES}** and removes a user from the restricted people's list.`,
			examples: ['@Pete']
		},
		COMMAND_UNWARN_DESCRIPTION: 'Appeal a warning moderation log case.',
		COMMAND_UNWARN_EXTENDED: {
			extendedHelp: `This command appeals a warning, it requires no permissions, you only give me the moderation log
					case to appeal and the reason.`,
			examples: ['0 Whoops, wrong dude.', '42 Turns out this was the definition of life.']
		},
		COMMAND_VMUTE_DESCRIPTION: "Throw somebody's microphone out the window.",
		COMMAND_VMUTE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MUTE_MEMBERS}**, and only members with lower role hierarchy position
					can be silenced by me. No, the guild's owner cannot be silenced. This action can be optionally timed to create
					a temporary voice mute.`,
			examples: ['@Pete', '@Pete Singing too loud', '@Pete Literally sang hear rape, for 24 hours.']
		},
		COMMAND_VOICEKICK_DESCRIPTION: 'Hit somebody with the 👢 for singing so bad and loud.',
		COMMAND_VOICEKICK_EXTENDED: {
			extendedHelp: `This command requires the permissions **${PERMS.MANAGE_CHANNELS}** to create a temporary (hidden)
					voice channel, and **${PERMS.MOVE_MEMBERS}** to move the user to the temporary channel. After this, the channel
					is quickly deleted, making the user leave the voice channel. For scared moderators, this command has almost no
					impact in the average user, as the channel is created in a way only me and the selected user can see and join,
					then quickly deleted.`,
			examples: ['@Pete', '@Pete Spamming all channels']
		},
		COMMAND_VUNMUTE_DESCRIPTION: "Get somebody's microphone back so they can talk.",
		COMMAND_VUNMUTE_EXTENDED: {
			extendedHelp: `This command requires **${PERMS.MUTE_MEMBERS}**, and only members with lower role hierarchy position
					can be un-silenced by me. No, the guild's owner cannot be un-silenced.`,
			examples: ['@Pete', '@Pete Appealed his times signing hear rape.']
		},
		COMMAND_WARN_DESCRIPTION: 'File a warning to somebody.',
		COMMAND_WARN_EXTENDED: {
			extendedHelp: `This command files a warning to a user. This kind of warning is meant to be **formal warnings**, as
					they will be shown in the 'warnings' command. It is a good practise to do an informal warning before using this
					command.`,
			examples: ['@Pete Attempted to mention everyone.']
		},

		/**
		 * ##################
		 * POKÉMON COMMANDS
		 */
		COMMAND_ABILITY_DESCRIPTION: 'Gets data for any given Pokémon ability using my Pokémon dataset.',
		COMMAND_ABILITY_EXTENDED: {
			extendedHelp: 'Uses a fuzzy search to also match against near-matches.',
			explainedUsage: [['ability', 'The ability for which you want to find data']],
			examples: ['multiscale', 'pressure']
		},
		COMMAND_ABILITY_EMBED_TITLE: 'Ability',
		COMMAND_ABILITY_QUERY_FAIL: ({ ability }) =>
			`I am sorry, but that query failed. Are you sure \`${ability}\` is actually an ability in Pokémon?`,
		COMMAND_FLAVORS_DESCRIPTION: 'Gets the dex entries across various games for a Pokémon.',
		COMMAND_FLAVORS_EXTENDED: {
			extendedHelp: `
				Uses a fuzzy search to also match against near-matches.
				You can provide a flag of \`--shiny\` to get the shiny sprite.
			`,
			explainedUsage: [['pokemon', 'The Pokémon for which you want to get flavour texts']],
			examples: ['dragonite', 'pikachu', 'pikachu --shiny']
		},
		COMMAND_FLAVORS_QUERY_FAIL: ({ pokemon }) => `I am sorry, but that query failed. Are you sure \`${pokemon}\` is actually a Pokémon?`,
		COMMAND_ITEM_DESCRIPTION: 'Gets data for any given Pokémon item using my Pokémon dataset.',
		COMMAND_ITEM_EXTENDED: {
			extendedHelp: 'Uses a fuzzy search to also match against near-matches.',
			explainedUsage: [['item', 'The item for which you want to find data']],
			examples: ['life orb', 'choice specs']
		},
		COMMAND_ITEM_EMEBED_DATA: {
			ITEM: 'Item',
			GENERATION_INTRODUCED: 'Generation introduced',
			AVAILABLE_IN_GENERATION_8_TITLE: 'Available in generation 8',
			AVAILABLE_IN_GENERATION_8_DATA: ({ available }) => (available ? 'Yes' : 'No')
		},
		COMMAND_ITEM_QUERY_FAIL: ({ item }) => `I am sorry, but that query failed. Are you sure \`${item}\` is actually a item in Pokémon?`,
		COMMAND_LEARN_DESCRIPTION: 'Retrieves whether a given Pokémon can learn one or more given moves using my Pokémon dataset.',
		COMMAND_LEARN_EXTENDED: {
			extendedHelp: `
				Uses a fuzzy search to also match against near-matches.
				Moves split on every \`, \` (comma space) and you can provide
				as many moves as you wish.
				You can provide a flag of \`--shiny\` to get the shiny sprite.
			`,
			explainedUsage: [
				['generation', '(Optional), The generation for which to check the data'],
				['pokemon', 'The Pokémon whose learnset you want to check'],
				['move', 'The move(s) you want to check for']
			],
			examples: ['7 dragonite dragon dance', 'pikachu thunder bolt', 'pikachu thunder bolt --shiny', 'pikachu thunder bolt, thunder']
		},
		COMMAND_LEARN_METHOD_TYPES: {
			levelUpMoves: ({ level }) => `by level up at level ${level}`,
			eventMoves: () => 'through an event',
			tutorMoves: () => 'from a move tutor',
			eggMoves: () => 'as an eggmove',
			virtualTransferMoves: () => 'by transfering from virtual console games',
			tmMoves: () => 'by using a technical machine or technical record',
			dreamworldMoves: () => 'through a Dream World capture'
		},
		COMMAND_LEARN_INVALID_GENERATION: ({ generation }) => `I am sorry, but ${generation} is not a supported Pokémon Generation`,
		COMMAND_LEARN_METHOD: ({ generation, pokemon, move, method }) =>
			`In generation ${generation} ${pokemon} __**can**__ learn **${move}** ${method}`,
		COMMAND_LEARN_QUERY_FAILED: ({ pokemon, moves }) =>
			`I am sorry, but that query failed. Are you sure you \`${pokemon}\` is actually a Pokémon and ${moves
				.map((move) => `\`${move}\``)
				.join(' and ')} are actually moves?`,
		COMMAND_LEARN_CANNOT_LEARN: ({ pokemon, moves }) => `Looks like ${toTitleCase(pokemon)} cannot learn ${this.list(moves, 'or')}`,
		COMMAND_LEARN_TITLE: ({ pokemon, generation }) => `Learnset data for ${toTitleCase(pokemon)} in generation ${generation}`,
		COMMAND_MOVE_DESCRIPTION: 'Gets data for any given Pokémon move using my Pokémon dataset',
		COMMAND_MOVE_EXTENDED: {
			extendedHelp: 'Uses a fuzzy search to also match against near-matches.',
			explainedUsage: [['move', 'The move for which you want to find data']],
			examples: ['dragon dance', 'GMax Wildfire', 'Genesis Supernova'],
			reminder: `
				Z-Move power may be shown for Generation 8 moves because it is calculated with a conversion table.
				If Pokémon ever returns Z-Moves to the game this would be their theoretical power, however as it stands
				Z-Moves are **NOT** in Generation 8.`
		},
		COMMAND_MOVE_EMBED_DATA: {
			MOVE: 'Move',
			TYPE: 'Type',
			BASE_POWER: 'Base Power',
			PP: 'PP',
			CATEGORY: 'Category',
			ACCURACY: 'Accuracy',
			PRIORITY: 'Priority',
			TARGET: 'Target',
			CONTEST_CONDITION: 'Contest Condition',
			Z_CRYSTAL: 'Z-Crystal',
			GMAX_POKEMON: 'G-MAX Pokémon',
			AVAILABLE_IN_GENERATION_8_TITLE: 'Available in Generation 8',
			AVAILABLE_IN_GENERATION_8_DATA: ({ available }) => (available ? 'Yes' : 'No'),
			NONE: 'None',
			MAX_MOVE_POWER: 'Base power as MAX move (Dynamax)',
			Z_MOVE_POWER: 'Base power as Z-Move (Z-Crystal)'
		},
		COMMAND_MOVE_QUERY_FAIL: ({ move }) => `I am sorry, but that query failed. Are you sure \`${move}\` is actually a move in Pokémon?`,
		COMMAND_POKEDEX_DESCRIPTION: 'Gets data for any given Pokémon using my Pokémon dataset.',
		COMMAND_POKEDEX_EXTENDED: {
			extendedHelp: `
				Uses a fuzzy search to also match against near-matches.
				You can provide a flag of \`--shiny\` to get the shiny sprite.
			`,
			explainedUsage: [['pokemon', 'The Pokémon for which you want to find data']],
			examples: ['dragonite', 'pikachu', 'pikachu --shiny'],
			reminder:
				'If there are any "Other forme(s)" on the optional fourth page, those can be requested as well. Cosmetic Formes on that page list purely cosmetic changes and these do not have seperate entries in the Pokédex.'
		},
		COMMAND_POKEDEX_EMBED_DATA: {
			TYPES: 'Type(s)',
			ABILITIES: 'Abilities',
			GENDER_RATIO: 'Gender Ratio',
			SMOGON_TIER: 'Smogon Tier',
			UKNOWN_SMOGON_TIER: 'Unknown / Alt form',
			HEIGHT: 'Height',
			WEIGHT: 'Weight',
			EGG_GROUPS: 'Egg group(s)',
			EVOLUTIONARY_LINE: 'Evolutionary line',
			BASE_STATS: 'Base stats',
			BASE_STATS_TOTAL: 'BST',
			FLAVOUR_TEXT: 'Pokdex entry',
			OTHER_FORMES_TITLE: 'Other forme(s)',
			COSMETIC_FORMES_TITLE: 'Cosmetic Formes',
			FORMES_LIST: ({ formes }) => this.list(formes, 'and')
		},
		COMMAND_POKEDEX_QUERY_FAIL: ({ pokemon }) => `I am sorry, but that query failed. Are you sure \`${pokemon}\` is actually a Pokémon?`,
		COMMAND_TYPE_DESCRIPTION: 'Gives the type matchups for one or two Pokémon types',
		COMMAND_TYPE_EXTENDED: {
			extendedHelp: 'Types have to be exact matches to pokemon types (upper/lowercase can be ignored)',
			explainedUsage: [['type', 'The type(s) to look up']],
			examples: ['dragon', 'fire flying']
		},
		COMMAND_TYPE_EMBED_DATA: {
			OFFENSIVE: 'Offensive',
			DEFENSIVE: 'Defensive',
			SUPER_EFFECTIVE_AGAINST: 'Supereffective against',
			DEALS_NORMAL_DAMAGE_TO: 'Deals normal damage to',
			DOES_NOT_AFFECT: "Doesn't affect",
			NOT_VERY_EFFECTIVE_AGAINST: 'Not very effective against',
			VULNERABLE_TO: 'Vulnerable to',
			TAKES_NORMAL_DAMAGE_FROM: 'Takes normal damage from',
			RESISTS: 'Resists',
			NOT_AFFECTED_BY: 'Not affected by',
			TYPE_EFFECTIVENESS_FOR: ({ type }) => `Type effectiveness for ${type.map((val) => `\`${val}\``).join(' and ')}`
		},
		COMMAND_TYPE_TOO_MANY_TYPES: 'I am sorry, but you can get the matchup for at most 2 types',
		COMMAND_TYPE_NOT_A_TYPE: ({ type }) => `${type} is not a valid Pokémon type`,
		COMMAND_TYPE_QUERY_FAIL: ({ types }) =>
			`I am sorry, but that query failed. Are you sure ${types.map((val) => `\`${val}\``).join(' and ')} are actually types in Pokémon?`,

		/**
		 * ##################
		 * OVERWATCH COMMANDS
		 */

		/**
		 * ###############
		 * SOCIAL COMMANDS
		 */

		COMMAND_SOCIAL_DESCRIPTION: "Configure this guild's member points.",
		COMMAND_SOCIAL_EXTENDED: {
			extendedHelp: "This command allows for updating other members' points.",
			explainedUsage: [
				['set <user> <amount>', 'Sets an amount of points to the user.'],
				['add <user> <amount>', 'Adds an amount of points to the user.'],
				['remove <user> <amount>', 'Removes an amount of points from the user.'],
				['reset <user>', 'Resets all pointss from the user.']
			],
			examples: ['set @kyra 40000', 'add @kyra 2400', 'remove @kyra 3000', 'reset @kyra']
		},
		COMMAND_BANNER_DESCRIPTION: 'Configure the banner for your profile.',
		COMMAND_BANNER_EXTENDED: {
			extendedHelp: 'Banners are vertical in Skyra, they decorate your profile card.',
			explainedUsage: [
				['list', '(Default) Lists all available banners.'],
				['reset', 'Set your displayed banner to default.'],
				['buy <bannerID>', 'Buy a banner, must be an ID.'],
				['set <bannerID>', 'Set your displayed banner, must be an ID.']
			],
			examples: ['list', 'buy 0w1p06', 'set 0w1p06', 'reset']
		},
		COMMAND_TOGGLEDARKMODE_DESCRIPTION: 'Toggle between light and dark templates for your profile and rank cards.',
		COMMAND_TOGGLEDARKMODE_EXTENDED: {
			extendedHelp: 'This command lets you toggle the template used to generate your profile.',
			examples: ['']
		},

		COMMAND_AUTOROLE_DESCRIPTION: '(ADM) List or configure the autoroles for a guild.',
		COMMAND_AUTOROLE_EXTENDED: {
			extendedHelp: `Autoroles? They are roles that are available for everyone, and automatically given when they reach an
					amount of (local) points, an administrator must configure them through a setting command.
					Note that if the role name has spaces in the name you need to put \`'quotes'\` around the name!`,
			explainedUsage: [
				['list', 'Lists all the current autoroles.'],
				['add <role> <amount>', 'Add a new autorole.'],
				['remove <role>', 'Remove an autorole from the list.'],
				['update <role> <amount>', 'Change the required amount of points for an existing autorole.']
			],
			reminder: 'The current system grants a random amount of points between 4 and 8 points, for each post with a 1 minute cooldown.',
			examples: ['list', "add 'Trusted Member' 20000", "update 'Trusted Member' 15000", "remove 'Trusted Member'"]
		},

		COMMAND_BALANCE_DESCRIPTION: 'Check your current balance.',
		COMMAND_BALANCE_EXTENDED: {
			extendedHelp: `The balance command retrieves your amount of ${SHINY}.`
		},
		COMMAND_DAILY_DESCRIPTION: `Get your semi-daily ${SHINY}'s.`,
		COMMAND_DAILY_EXTENDED: {
			extendedHelp: 'Shiiiiny!',
			reminder: [
				'Skyra uses a virtual currency called Shiny, and it is used to buy stuff such as banners or bet it on slotmachines.',
				'You can claim dailies once every 12 hours.'
			].join('\n')
		},
		COMMAND_LEADERBOARD_DESCRIPTION: 'Check the leaderboards.',
		COMMAND_LEADERBOARD_EXTENDED: {
			extendedHelp: `The leaderboard command shows a list of users sorted by their local or global amount of points,
				by default, when using no arguments, it will show the local leaderboard. The leaderboards refresh after 10
					minutes.`,
			reminder: '"Local" leaderboards refer to the guild\'s top list. "Global" refers to all scores from all guilds.'
		},
		COMMAND_LEVEL_DESCRIPTION: 'Check your global level.',
		COMMAND_LEVEL_EXTENDED: {
			extendedHelp: 'How much until the next level?',
			explainedUsage: [['user', "(Optional) The user's profile to show. Defaults to the message's author!."]]
		},
		COMMAND_DIVORCE_DESCRIPTION: 'Break up with your couple!',
		COMMAND_DIVORCE_EXTENDED: {
			extendedHelp: `Sniff... This command is used to break up with your couple, hopefully in this virtual world, you are
					allowed to marry the user again.`
		},
		COMMAND_MARRY_DESCRIPTION: 'Marry somebody!',
		COMMAND_MARRY_EXTENDED: {
			extendedHelp: 'Marry your waifu!',
			explainedUsage: [['user', '(Optional) The user to marry with. If not given, the command will tell you who are you married with.']],
			examples: ['', '@love']
		},
		COMMAND_MYLEVEL_DESCRIPTION: 'Check your local level.',
		COMMAND_MYLEVEL_EXTENDED: {
			extendedHelp: 'How much until next auto role? How many points do I have in this guild?',
			explainedUsage: [['user', "(Optional) The user's profile to show. Defaults to the message's author!."]]
		},
		COMMAND_PAY_DESCRIPTION: `Pay somebody with your ${SHINY}'s.`,
		COMMAND_PAY_EXTENDED: {
			extendedHelp: 'Businessmen! Today is payday!',
			explainedUsage: [
				['money', `Amount of ${SHINY} to pay, you must have the amount you are going to pay.`],
				['user', 'The targeted user to pay. (Must be mention/id)']
			],
			examples: ['200 @kyra']
		},
		COMMAND_PROFILE_DESCRIPTION: 'Check your user profile.',
		COMMAND_PROFILE_EXTENDED: {
			extendedHelp: `This command sends a card image with some of your user profile such as your global rank, experience...
				Additionally, you are able to customize your colours with the 'setColor' command.`,
			explainedUsage: [['user', "(Optional) The user's profile to show. Defaults to the message's author!."]]
		},
		COMMAND_REMINDME_DESCRIPTION: 'Manage your reminders.',
		COMMAND_REMINDME_EXTENDED: {
			extendedHelp: 'This command allows you to set, delete and list reminders.',
			explainedUsage: [
				['action', 'The action, one of "list", "show", "delete", or "create"/"me". Defaults to "list".'],
				['idOrDuration', 'Dependent of action; "list" → ignored; "delete"/"show" → reminder ID; else → duration.'],
				['description', '(Optional) Dependent of action, this is only read when creating a new reminder.']
			],
			examples: ['me 6h to fix this command.', 'list', 'show jedbcuywb', 'delete jedbcuywb']
		},
		COMMAND_REPUTATION_DESCRIPTION: 'Give somebody a reputation point.',
		COMMAND_REPUTATION_EXTENDED: {
			extendedHelp: `This guy is so helpful... I'll give him a reputation point! Additionally, you can check how many
					reputation points a user has by writing 'check' before the mention.`,
			explainedUsage: [
				['check', '(Optional) Whether you want to check somebody (or yours) amount of reputation.'],
				['user', 'The user to give a reputation point.']
			],
			reminder: 'You can give a reputation point once every 24 hours.',
			examples: ['check @kyra', 'check', '@kyra', 'check "User With Spaces"', '"User With Spaces"']
		},
		COMMAND_SETCOLOR_DESCRIPTION: "Change your user profile's color.",
		COMMAND_SETCOLOR_EXTENDED: {
			extendedHelp: 'The setColor command sets a color for your profile.',
			explainedUsage: [['color', 'A color resolvable.']],
			possibleFormats: [
				['HEX', '#dfdfdf'],
				['RGB', 'rgb(200, 200, 200)'],
				['HSL', 'hsl(350, 100, 100)'],
				['B10', '14671839']
			]
		},

		/**
		 * ##################
		 * STARBOARD COMMANDS
		 */

		COMMAND_STAR_DESCRIPTION: 'Get a random starred message from the database or the star leaderboard.',
		COMMAND_STAR_EXTENDED: {
			extendedHelp: 'This command shows a random starred message or the starboard usage and leaderboard for this server.'
		},

		/**
		 * ###############
		 * SYSTEM COMMANDS
		 */

		COMMAND_DM_DESCRIPTION: 'Sends a Direct Message. Reserved for bot owner for replying purposes.',
		COMMAND_DM_EXTENDED: {
			extendedHelp: `The DM command is reserved for bot owner, and it's only used for very certain purposes, such as replying feedback
				messages sent by users.`
		},
		COMMAND_EVAL_DESCRIPTION: 'Evaluates arbitrary Javascript. Reserved for bot owner.',
		COMMAND_EVAL_EXTENDED: {
			extendedHelp: `The eval command evaluates code as-in, any error thrown from it will be handled.
					It also uses the flags feature. Write --silent, --depth=number or --async to customize the output.
					The --wait flag changes the time the eval will run. Defaults to 10 seconds. Accepts time in milliseconds.
					The --output and --output-to flag accept either 'file', 'log', 'haste' or 'hastebin'.
					The --delete flag makes the command delete the message that executed the message after evaluation.
					The --silent flag will make it output nothing.
					The --depth flag accepts a number, for example, --depth=2, to customize util.inspect's depth.
					The --async flag will wrap the code into an async function where you can enjoy the use of await, however, if you want to return something, you will need the return keyword
					The --showHidden flag will enable the showHidden option in util.inspect.
					The --lang and --language flags allow different syntax highlight for the output.
					The --json flag converts the output to json
					The --no-timeout flag disables the timeout
					If the output is too large, it'll send the output as a file, or in the console if the bot does not have the ${PERMS.ATTACH_FILES} permission.`,
			examples: ['msg.author!.username;', '1 + 1;'],
			multiline: true
		},
		COMMAND_EXEC_DESCRIPTION: 'Execute Order 66.',
		COMMAND_EXEC_EXTENDED: {
			extendedHelp: 'You better not know about this.'
		},
		COMMAND_SETAVATAR_DESCRIPTION: "Set Skyra's avatar.",
		COMMAND_SETAVATAR_EXTENDED: {
			extendedHelp: "This command changes Skyra's avatar. You can send a URL or upload an image attachment to the channel."
		},
		COMMAND_DONATE_DESCRIPTION: 'Get information about how to donate to keep Skyra alive longer.',
		COMMAND_DONATE_EXTENDED: {
			extendedHelp: `
				Skyra Project started on 24th October 2016, if you are reading this, you are
				using the version ${VERSION}, which is the twelfth rewrite. I have
				improved a lot every single function from Skyra, and now, she is extremely fast.

				However, not everything is free, I need your help to keep Skyra alive in a VPS so
				you can enjoy her functions longer. I will be very thankful if you help me, really,
				I have been working on a lot of things, but she is my beautiful baby, take care of her ❤

				Do you want to support this amazing project? Feel free to do so! https://www.patreon.com/kyranet`
		},
		COMMAND_ECHO_DESCRIPTION: 'Make Skyra send a message to this (or another) channel.',
		COMMAND_ECHO_EXTENDED: {
			extendedHelp: 'This should be very obvious...'
		},
		COMMAND_FEEDBACK_DESCRIPTION: "Send a feedback message to the bot's owner.",
		COMMAND_FEEDBACK_EXTENDED: {
			extendedHelp: `This command sends a message to a feedback channel where the bot's owner can read. You'll be replied
					as soon as an update comes.`
		},
		COMMAND_STATS_DESCRIPTION: 'Provides some details about the bot and stats.',
		COMMAND_STATS_EXTENDED: {
			extendedHelp: 'This should be very obvious...'
		},

		/**
		 * ##############
		 * TOOLS COMMANDS
		 */

		COMMAND_AVATAR_DESCRIPTION: "View somebody's avatar in full size.",
		COMMAND_AVATAR_EXTENDED: {
			extendedHelp: "As this command's name says, it shows somebody's avatar. Use the --size flag to change the avatar's size.",
			explainedUsage: [['user', '(Optional) A user mention. Defaults to the author if the input is invalid or not given.']]
		},
		COMMAND_COLOR_DESCRIPTION: 'Display some awesome colours.',
		COMMAND_COLOR_EXTENDED: {
			extendedHelp: 'The color command displays a set of colours with nearest tones given a difference between 1 and 255..',
			explainedUsage: [['color', 'A color resolvable.']],
			possibleFormats: [
				['HEX', '#dfdfdf'],
				['RGB', 'rgb(200, 200, 200)'],
				['HSL', 'hsl(350, 100, 100)'],
				['B10', '14671839']
			],
			examples: ['#dfdfdf >25', 'rgb(200, 130, 75)']
		},
		COMMAND_CONTENT_DESCRIPTION: "Get messages' raw content.",
		COMMAND_CONTENT_EXTENDED: {},
		COMMAND_EMOJI_DESCRIPTION: 'Get info on an emoji.',
		COMMAND_EMOJI_EXTENDED: {},
		COMMAND_EMOTES_DESCRIPTION: 'Shows all custom emotes available on this server',
		COMMAND_EMOTES_EXTENDED: {
			extendedHelp: 'The list of emotes is split per 50 emotes'
		},
		COMMAND_EMOTES_TITLE: 'Emotes in',
		COMMAND_PRICE_DESCRIPTION: 'Convert between currencies with this command.',
		COMMAND_PRICE_EXTENDED: {
			extendedHelp: 'Convert between any two currencies, even if they are cryptocurrencies.',
			explainedUsage: [
				['from', 'The currency to convert from'],
				['to', 'The currency to convert to'],
				['amount', 'The amount to convert, will default to 1']
			],
			examples: ['EUR USD', 'USD EUR 5', 'USD BAT 10']
		},
		COMMAND_QUOTE_DESCRIPTION: "Quote another person's message.",
		COMMAND_QUOTE_EXTENDED: {},
		COMMAND_ROLES_DESCRIPTION: 'List all public roles from a guild, or claim/unclaim them.',
		COMMAND_ROLES_EXTENDED: {
			extendedHelp: `Public roles? They are roles that are available for everyone, an administrator must configure
					them with a configuration command.`,
			explainedUsage: [['Roles', 'The list of roles to claim and unclaim. Leave this empty to get a list of roles']],
			reminder: [
				'When using claim/unclaim, the roles can be individual, or multiple.',
				'To claim multiple roles, you must separate them by a comma.',
				'You can specify which roles by writting their ID, name, or a section of the name.'
			].join('\n'),
			examples: ['', 'Designer, Programmer', 'Designer']
		},
		COMMAND_SEARCH_DESCRIPTION: 'Search things from the Internet with DuckDuckGo.',
		COMMAND_SEARCH_EXTENDED: {},
		COMMAND_POLL_DESCRIPTION: 'Simplified reaction-based poll.',
		COMMAND_POLL_EXTENDED: {
			extendedHelp: `spoll stands for "simplified poll". You may want to use this command if you don't want to deal the
					complexity of the other command. Simplified Polls do not track the users who vote nor it filters, it merely reacts
					to your message with three emojis and let the users vote.`,
			examples: ['Should I implement the #anime channel?']
		},
		COMMAND_TOPINVITES_DESCRIPTION: 'Shows the top 10 most used invites for this server',
		COMMAND_TOPINVITES_EXTENDED: {},
		COMMAND_TOPINVITES_NO_INVITES: 'There are no invites, or none of them have been used!',
		COMMAND_TOPINVITES_TOP_10_INVITES_FOR: ({ guild }) => `Top 10 invites for ${guild}`,
		COMMAND_TOPINVITES_EMBED_DATA: {
			CHANNEL: 'Channel',
			LINK: 'Link',
			CREATED_AT: 'Date Created',
			CREATED_AT_UNKNOWN: 'Creation date unknown',
			EXPIRES_IN: 'Expires in',
			NEVER_EXPIRES: 'Never',
			TEMPORARY: 'Temporary invite',
			USES: 'Uses'
		},
		COMMAND_URBAN_DESCRIPTION: 'Check the definition of a word on UrbanDictionary.',
		COMMAND_URBAN_EXTENDED: {
			extendedHelp: 'What does "spam" mean?',
			explainedUsage: [
				['Word', 'The word or phrase you want to get the definition from.'],
				['Page', 'Defaults to 1, the page you wish to read.']
			],
			examples: ['spam']
		},
		COMMAND_WHOIS_DESCRIPTION: 'Who are you?',
		COMMAND_WHOIS_EXTENDED: {},
		COMMAND_FOLLOWAGE_DESCRIPTION: 'Check how long a Twitch user has been following a channel.',
		COMMAND_FOLLOWAGE_EXTENDED: {
			extendedHelp: 'Just... that.',
			examples: ['dallas cohhcarnage']
		},
		COMMAND_TWITCH_DESCRIPTION: 'Check the information about a Twitch profile.',
		COMMAND_TWITCH_EXTENDED: {
			extendedHelp: 'Really, just that.',
			examples: ['riotgames']
		},
		COMMAND_TWITCHSUBSCRIPTION_DESCRIPTION: 'Manage the subscriptions for your server.',
		COMMAND_TWITCHSUBSCRIPTION_EXTENDED: {
			extendedHelp: `
				Manage the subscriptions for this server.
				__Online Notifications__
				For content, the best way is writing \`--embed\`, the notifications will then show up in MessageEmbeds
				with all available data. Alternatively you can set your own content and it will post as a regular message.
				This content can contain some parameters that will be replaced with Twitch data:
				- \`%TITLE%\` for the stream's title
				- \`%VIEWER_COUNT%\` for the amount of current viewers,
				- \`%GAME_NAME%\` for the title being streamed
				- \`%GAME_ID%\` for the game's ID as seen by Twitch
				- \`%LANGUAGE%\` for the language the stream is in
				- \`%USER_ID%\` for the streamer's ID as seen by Twitch
				- and \`%USER_NAME%\` for the Streamer's twitch username.

				__Offline Notifications__
				For offline events none of the variables above are available and you'll have to write your own content.
				You can still use the \`--embed\` flag for the notification to show in a nice Twitch-purple MessageEmbed.`,
			explainedUsage: [
				[this.list(['add', 'remove', 'reset', 'show'], 'or'), 'The subcommand to trigger.'],
				['streamer', 'The Twitch username of the streamer to get notifications for.'],
				['channel', 'A Discord channel where to post the notifications in.'],
				['status', `The status that the Twitch streamer should get for an notification, one of ${this.list(['online', 'offline'], 'or')}.`],
				['content', 'The message to send in Discord chat. Refer to extended help above for more information.']
			],
			examples: [
				'add favna #twitch online --embed',
				'add favna #twitch online %USER_NAME% went live | %TITLE%',
				'remove kyranet #twitch online',
				'reset kyranet',
				'reset',
				'show kyranet',
				'show'
			],
			multiline: true
		},
		COMMAND_WIKIPEDIA_DESCRIPTION: 'Search something through Wikipedia.',
		COMMAND_WIKIPEDIA_EXTENDED: {},
		COMMAND_YOUTUBE_DESCRIPTION: 'Search something through YouTube.',
		COMMAND_YOUTUBE_EXTENDED: {},

		/**
		 * ################
		 * GOOGLE COMMANDS
		 */

		COMMAND_CURRENTTIME_DESCRIPTION: 'Gets the current time in any location on the world',
		COMMAND_CURRENTTIME_EXTENDED: {
			extendedHelp: `This command uses Google Maps to get the coordinates of the place, this step also allows multilanguage
				support as it is... Google Search. Once this command got the coordinates, it queries TimezoneDB to get the time data`,
			explainedUsage: [['location', 'The locality, governing, country or continent to check the time for.']],
			examples: ['Antarctica', 'Arizona']
		},
		COMMAND_CURRENTTIME_LOCATION_NOT_FOUND: 'I am sorry, but I could not find time data for that location.',
		COMMAND_CURRENTTIME_TITLES: {
			CURRENT_TIME: 'Current Time',
			CURRENT_DATE: 'Current Date',
			COUNTRY: 'Country',
			GMT_OFFSET: 'GMT Offset',
			DST: ({ dst }) => `**DST**: ${dst === 0 ? 'Does not observe DST right now' : 'Observes DST right now'}`
		},
		COMMAND_GSEARCH_DESCRIPTION: 'Find your favourite things on Google',
		COMMAND_GSEARCH_EXTENDED: {
			extendedHelp: `This command queries the powerful Google Search engine to find websites for your query.
				For images please use the \`gimage\` command.`,
			explainedUsage: [['query', 'The thing you want to find on Google']],
			examples: ['Discord', 'Skyra']
		},
		COMMAND_GIMAGE_DESCRIPTION: 'Find your favourite images on Google',
		COMMAND_GIMAGE_EXTENDED: {
			extendedHelp: `This command queries the powerful Google Search engine to find images for your query.
				For regular web results please use the \`gsearch\` command.
				This command has been marked as NSFW because it is unavoidable that when you query explicit content, you will get explicit results.`,
			explainedUsage: [['query', 'The image you want to find on Google']],
			examples: ['Discord', 'Skyra']
		},
		COMMAND_LMGTFY_DESCRIPTION: 'Annoy another user by sending them a LMGTFY (Let Me Google That For You) link.',
		COMMAND_LMGTFY_EXTENDED: {
			explainedUsage: [['query', 'The query to google']]
		},
		COMMAND_WEATHER_DESCRIPTION: 'Check the weather status in a location.',
		COMMAND_WEATHER_EXTENDED: {
			extendedHelp: `This command uses Google Maps to get the coordinates of the place, this step also allows multilanguage
				support as it is... Google Search. Once this command got the coordinates, it queries DarkSky to retrieve
					information about the weather. Note: temperature is in **Celsius**`,
			explainedUsage: [['city', 'The locality, governing, country or continent to check the weather from.']],
			examples: ['Antarctica', 'Arizona']
		},
		GOOGLE_ERROR_ZERO_RESULTS: 'Your request returned no results.',
		GOOGLE_ERROR_REQUEST_DENIED: 'The GeoCode API Request was denied.',
		GOOGLE_ERROR_INVALID_REQUEST: 'Invalid request.',
		GOOGLE_ERROR_OVER_QUERY_LIMIT: 'Query Limit exceeded. Try again tomorrow.',
		GOOGLE_ERROR_UNKNOWN: 'I am sorry, but I failed to get a result from Google.',

		/**
		 * #############
		 * WEEB COMMANDS
		 */

		COMMAND_WBLUSH_DESCRIPTION: 'Blush with a weeb picture!',
		COMMAND_WBLUSH_EXTENDED: {
			extendedHelp: 'Blush with a random weeb image!'
		},
		COMMAND_WCRY_DESCRIPTION: 'Cry to somebody with a weeb picture!',
		COMMAND_WCRY_EXTENDED: {
			extendedHelp: 'Cry with a random weeb image!',
			explainedUsage: [['user', 'The user to cry to.']],
			examples: ['@Skyra']
		},
		COMMAND_WCUDDLE_DESCRIPTION: 'Cuddle somebody with a weeb picture!',
		COMMAND_WCUDDLE_EXTENDED: {
			extendedHelp: 'Unlike the original cuddle command, this one displays random weeb images, enjoy!',
			explainedUsage: [['user', 'The user to cuddle with.']],
			examples: ['@Skyra']
		},
		COMMAND_WDANCE_DESCRIPTION: 'Dance with a weeb picture!',
		COMMAND_WDANCE_EXTENDED: {
			extendedHelp: 'Dance with a random weeb image!'
		},
		COMMAND_WHUG_DESCRIPTION: 'Hug somebody with a weeb picture!',
		COMMAND_WHUG_EXTENDED: {
			extendedHelp: 'Unlike the original hug command, this one displays random weeb images, enjoy!',
			explainedUsage: [['user', 'The user to give the hug.']],
			examples: ['@Skyra']
		},
		COMMAND_WKISS_DESCRIPTION: 'Kiss somebody with a weeb picture!',
		COMMAND_WKISS_EXTENDED: {
			extendedHelp: 'Kiss somebody with a random weeb image!',
			explainedUsage: [['user', 'The user to give the kiss to.']],
			examples: ['@Skyra']
		},
		COMMAND_WLICK_DESCRIPTION: 'Lick somebody with a weeb picture!',
		COMMAND_WLICK_EXTENDED: {
			extendedHelp: 'Lick somebody with a random weeb image!',
			explainedUsage: [['user', 'The user to lick.']],
			examples: ['@Skyra']
		},
		COMMAND_WNOM_DESCRIPTION: 'Nom nom with a 🍞!',
		COMMAND_WNOM_EXTENDED: {
			extendedHelp: "Nom nom nom! Wha~... I'm busy eating!"
		},
		COMMAND_WNEKO_DESCRIPTION: 'Human kittens!',
		COMMAND_WNEKO_EXTENDED: {
			extendedHelp: `Unlike the original kitten command, this one displays random weeb images, the difference is that
					they're weebs... and humans, enjoy!`
		},
		COMMAND_WPAT_DESCRIPTION: "Pats somebody's head!",
		COMMAND_WPAT_EXTENDED: {
			extendedHelp: "Pat somebody's head with a random weeb image!",
			explainedUsage: [['user', 'The user to pat with.']],
			examples: ['@Skyra']
		},
		COMMAND_WPOUT_DESCRIPTION: 'I feel somebody... mad',
		COMMAND_WPOUT_EXTENDED: {
			extendedHelp: 'Show your expression with a random weeb image!'
		},
		COMMAND_WSLAP_DESCRIPTION: 'Slap somebody with a weeb picture!',
		COMMAND_WSLAP_EXTENDED: {
			extendedHelp: 'Unlike the original slap command, this one displays random weeb images, enjoy!',
			explainedUsage: [['user', 'The user to slap.']],
			examples: ['@Pete']
		},
		COMMAND_WSMUG_DESCRIPTION: 'Smug',
		COMMAND_WSMUG_EXTENDED: {
			extendedHelp: 'Just an anime smug face!'
		},
		COMMAND_WSTARE_DESCRIPTION: '*Stares*',
		COMMAND_WSTARE_EXTENDED: {
			extendedHelp: '*Still stares at you*',
			explainedUsage: [['user', 'The user to stare at.']],
			examples: ['@Pete']
		},
		COMMAND_WTICKLE_DESCRIPTION: 'Give tickles to somebody with a weeb picture!',
		COMMAND_WTICKLE_EXTENDED: {
			extendedHelp: 'Tickle somebody!',
			explainedUsage: [['user', 'The user to tickle.']],
			examples: ['@Skyra']
		},
		COMMAND_WBANG_DESCRIPTION: 'Bang 💥🔫!',
		COMMAND_WBANG_EXTENDED: {
			extendedHelp: 'Shoot a user with a random weeb image!',
			explainedUsage: [['user', 'The user to shoot.']],
			examples: ['@Skyra']
		},
		COMMAND_WBANGHEAD_DESCRIPTION: "STAHP! I'm banging my head here!",
		COMMAND_WBANGHEAD_EXTENDED: {
			extendedHelp: 'Bang your head with a random weeb image!'
		},
		COMMAND_WBITE_DESCRIPTION: '*nom nom* you are delicious!',
		COMMAND_WBITE_EXTENDED: {
			extendedHelp: 'Bite a user with a random weeb image!',
			explainedUsage: [['user', 'The user to bite.']],
			examples: ['@Skyra']
		},
		COMMAND_WGREET_DESCRIPTION: 'Say hi! to another user',
		COMMAND_WGREET_EXTENDED: {
			extendedHelp: 'Greet a user with a random weeb image!',
			explainedUsage: [['user', 'The user to greet.']],
			examples: ['@Skyra']
		},
		COMMAND_WLEWD_DESCRIPTION: 'Lewds! Lewds! Lewds!',
		COMMAND_WLEWD_EXTENDED: {
			extendedHelp: 'Random lewd weeb image!'
		},
		COMMAND_WPUNCH_DESCRIPTION: '*pow* 👊👊',
		COMMAND_WPUNCH_EXTENDED: {
			extendedHelp: 'Punch that annoying user with a random weeb image!',
			explainedUsage: [['user', 'The user to punch.']],
			examples: ['@Skyra']
		},
		COMMAND_WSLEEPY_DESCRIPTION: "I'm so sleeeeepy... *yawn*",
		COMMAND_WSLEEPY_EXTENDED: {
			extendedHelp: 'Show how sleepy you are with a random weeb image!'
		},
		COMMAND_WSMILE_DESCRIPTION: "Huh, because I'm happy. Clap along if you feel like a room without a roof",
		COMMAND_WSMILE_EXTENDED: {
			extendedHelp: 'Show just how happy you are with a random weeb image!'
		},
		COMMAND_WTHUMBSUP_DESCRIPTION: 'Raise your thumb into the air in a magnificent show of approval',
		COMMAND_WTHUMBSUP_EXTENDED: {
			extendedHelp: 'Raise your thumb with a random weeb image!'
		},

		/**
		 * #################################
		 * #       COMMAND RESPONSES       #
		 * #################################
		 */

		/**
		 * ##############
		 * ANIME COMMANDS
		 */

		COMMAND_ANIME_TYPES: {
			TV: '📺 TV',
			MOVIE: '🎥 Movie',
			OVA: '📼 Original Video Animation',
			SPECIAL: '🎴 Special'
		},
		COMMAND_ANIME_INVALID_CHOICE: "That's an invalid choice! Please try with another option.",
		COMMAND_ANIME_OUTPUT_DESCRIPTION: ({ entry, synopsis }) =>
			[
				`**English title:** ${entry.titles.en || entry.titles.en_us || 'None'}`,
				`**Japanese title:** ${entry.titles.ja_jp || 'None'}`,
				`**Canonical title:** ${entry.canonicalTitle || 'None'}`,
				synopsis ?? 'No synopsis available for this title.'
			].join('\n'),
		COMMAND_ANIME_EMBED_DATA: {
			TYPE: 'Type',
			SCORE: 'Score',
			EPISODES: 'Episode(s)',
			EPISODE_LENGTH: 'Episode length',
			AGE_RATING: 'Age rating',
			FIRST_AIR_DATE: 'First air date',
			WATCH_IT: 'Watch it here:',
			STILL_AIRING: 'Still airing'
		},
		COMMAND_MANGA_OUTPUT_DESCRIPTION: ({ entry, synopsis }) =>
			[
				`**English title:** ${entry.titles.en || entry.titles.en_us || 'None'}`,
				`**Japanese title:** ${entry.titles.ja_jp || 'None'}`,
				`**Canonical title:** ${entry.canonicalTitle || 'None'}`,
				synopsis ?? 'No synopsis available for this title.'
			].join('\n'),
		COMMAND_MANGA_TYPES: {
			MANGA: '📘 Manga',
			NOVEL: '📕 Novel',
			MANHWA: '🇰🇷 Manhwa',
			'ONE-SHOT': '☄ One Shot',
			SPECIAL: '🎴 Special'
		},
		COMMAND_MANGA_EMBED_DATA: {
			AGE_RATING: 'Age Rating',
			FIRST_PUBLISH_DATE: 'First published on',
			READ_IT: 'Read it here:',
			SCORE: 'Score',
			TYPE: 'Subtype',
			NONE: 'None'
		},
		COMMAND_WAIFU_FOOTER: 'Powered by thiswaifudoesnotexist.net',

		/**
		 * #####################
		 * ANNOUNCEMENT COMMANDS
		 */

		COMMAND_SUBSCRIBE_NO_ROLE: 'This server does not have a configured announcement role.',
		COMMAND_SUBSCRIBE_SUCCESS: ({ role }) => `Successfully granted the role: **${role}**`,
		COMMAND_UNSUBSCRIBE_SUCCESS: ({ role }) => `Successfully removed the role: **${role}**`,
		COMMAND_SUBSCRIBE_NO_CHANNEL: 'This server does not have a configured announcement channel.',
		COMMAND_ANNOUNCEMENT: ({ role }) => `**New announcement for** ${role}`,
		COMMAND_ANNOUNCEMENT_SUCCESS: 'Successfully posted a new announcement.',
		COMMAND_ANNOUNCEMENT_CANCELLED: 'Cancelled the message.',
		COMMAND_ANNOUNCEMENT_PROMPT: 'This will be the message sent in the announcement channel. Are you OK with this?',
		COMMAND_ANNOUNCEMENT_EMBED_MENTIONS: ({ header, mentions }) =>
			`${header}${mentions.length ? `, and mentioning: ${this.list(mentions, 'and')}` : ''}:`,

		/**
		 * ################
		 * GENERAL COMMANDS
		 */

		COMMAND_INVITE_DESCRIPTION: 'Shows the invite link to add Skyra to your server.',
		COMMAND_INVITE_EXTENDED: {
			extendedHelp:
				'If you would like to get a link where Skyra will not ask for any permissions add either `noperms`, `--noperms` or `--nopermissions` to the command.',
			examples: ['', 'noperms', '--noperms', '--nopermissions']
		},
		COMMAND_INVITE: () =>
			[
				`To add Skyra to your server: <${this.client.invite}>`,
				"Don't be afraid to uncheck some permissions, I will let you know if you're trying to run a command without permissions."
			].join('\n'),
		COMMAND_INVITE_NO_PERMS: () => `To add Skyra to your server: <https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot>`,
		COMMAND_INFO: [
			`Skyra ${VERSION} is a multi-purpose Discord Bot designed to run the majority of tasks with a great performance and constant 24/7 uptime.`,
			"She is built on top of Klasa, a 'plug-and-play' framework built on top of the Discord.js library.",
			'',
			'Skyra features:',
			'• Advanced Moderation with temporary actions included',
			'• Announcement management',
			'• Fully configurable',
			'• Message logs, member logs, and mod logs',
			'• Multilingual',
			'• Profiles and levels, with leaderboards and social management',
			'• Role management',
			'• Weeb commands (+10)!',
			'And more!'
		].join('\n'),
		COMMAND_HELP_DATA: {
			TITLE: ({ description }) => `${description}`,
			USAGE: ({ usage }) => `📝 | ***Command Usage***\n\`${usage}\`\n`,
			EXTENDED: ({ extendedHelp }) => `🔍 | ***Extended Help***\n${extendedHelp}`,
			FOOTER: ({ name }) => `Command help for ${name}`
		},
		COMMAND_SUPPORT_EMBED_TITLE: ({ username }) => `Looking for help, ${username}?`,
		COMMAND_SUPPORT_EMBED_DESCRIPTION:
			"Then you should probably join [Skyra's Lounge](https://join.skyra.pw)! There, you can receive support by the developers and other members of the community!",

		/**
		 * #####################
		 * DEVELOPERS COMMANDS
		 */

		COMMAND_YARN_DESCRIPTION: 'Responds with information on a NodeJS package using the Yarn package registry',
		COMMAND_YARN_EXTENDED: {
			extendedHelp: `This is for NodeJS developers who want to quickly find information on a package published to [npm](https://npmjs.com)`,
			explainedUsage: [['package', 'The name of the package to search for, has to be an exact match']],
			examples: ['@skyra/char', '@skyra/saelem', '@skyra/eslint-config']
		},
		COMMAND_YARN_NO_PACKAGE: `${REDCROSS} I am sorry, but you have to give me the name of a package to look up.`,
		COMMAND_YARN_UNPUBLISHED_PACKAGE: ({ pkg }) => `What a silly developer who made ${pkg}! They unpublished it!`,
		COMMAND_YARN_PACKAGE_NOT_FOUND: ({ pkg }) => `I'm sorry, but I could not find any package by the name of \`${pkg}\` in the registry.`,
		COMMAND_YARN_EMBED_DATA: {
			DESCRIPTION: ({
				author,
				dateCreated,
				dateModified,
				dependencies,
				deprecated,
				description,
				latestVersionNumber,
				license,
				mainFile,
				maintainers
			}) =>
				[
					description,
					'',
					author ? `❯ Author: ${author}` : undefined,
					`❯ Maintainers: **${this.list(maintainers, 'and')}**`,
					`❯ Latest version: **${latestVersionNumber}**`,
					`❯ License: **${license}**`,
					`❯ Main File: **${mainFile}**`,
					`❯ Date Created: **${dateCreated}**`,
					`❯ Date Modified: **${dateModified}**`,
					deprecated ? `❯ Deprecation Notice: **${deprecated}**` : undefined,
					'',
					'__*Dependencies:*__',
					dependencies && dependencies.length ? this.list(dependencies, 'and') : `No dependencies ${GREENTICK}!`
				]
					.filter((part) => part !== undefined)
					.join('\n'),
			MORE_TEXT: 'more...'
		},

		/**
		 * ##############
		 * FUN COMMANDS
		 */

		COMMAND_8BALL_OUTPUT: ({ author, question, response }) => `🎱 Question by ${author}: *${question}*\n${response}`,
		COMMAND_8BALL_QUESTIONS: {
			WHEN: 'when',
			WHAT: 'what',
			HOW_MUCH: 'how much',
			HOW_MANY: 'how many',
			WHY: 'why',
			WHO: 'who'
		},
		COMMAND_8BALL_WHEN: createPick(['Soon™', 'Maybe tomorrow.', 'Maybe next year...', 'Right now.', 'In a few months.']),
		COMMAND_8BALL_WHAT: createPick(['A plane.', 'What? Ask again.', 'A gift.', 'Nothing.', 'A ring.', 'I do not know, maybe something.']),
		COMMAND_8BALL_HOW_MUCH: createPick([
			'A lot.',
			'A bit.',
			'A few.',
			'Ask me tomorrow.',
			'I do not know, ask a physicist.',
			'Nothing.',
			`Within ${random(10)} and ${random(1000)}L.`,
			`${random(10)}e${random(1000)}L.`,
			"2 or 3 liters, I don't remember.",
			'Infinity.',
			'1010 liters.'
		]),
		COMMAND_8BALL_HOW_MANY: createPick([
			'A lot.',
			'A bit.',
			'A few.',
			'Ask me tomorrow.',
			"I don't know, ask a physicist.",
			'Nothing.',
			`Within ${random(10)} and ${random(1000)}.`,
			`${random(10)}e${random(1000)}.`,
			'2 or 3, I do not remember.',
			'Infinity',
			'1010.'
		]),
		COMMAND_8BALL_WHY: createPick([
			'Maybe genetics.',
			'Because somebody decided it.',
			'For the glory of satan, of course!',
			'I do not know, maybe destiny.',
			'Because I said so.',
			'I have no idea.',
			'Ask the owner of this server.',
			'Ask again.',
			'To get to the other side.',
			'It says so in the Bible.'
		]),
		COMMAND_8BALL_WHO: createPick([
			'A human.',
			'A robot.',
			'An airplane.',
			'A bird.',
			'A carbon composition.',
			'A bunch of zeroes and ones.',
			'I have no clue, is it material?',
			'That is not logical.'
		]),
		COMMAND_8BALL_ELSE: createPick([
			'Most likely.',
			'Nope.',
			'YES!',
			'Maybe.',
			'As I see it, yes',
			'Ask me tomorrow.',
			"I don't know, ask a physicist.",
			'Better not tell you now.',
			'Don’t count on it.',
			'It is certain.',
			'It is decidedly so.',
			'My sources say no.',
			'Outlook not so good.',
			'Outlook good.',
			'Reply hazy, try again.',
			'Signs point to yes.',
			'Very doubtful.',
			'Without a doubt.',
			'Yes – definitely.',
			'You may rely on it.'
		]),

		COMMAND_CATFACT_TITLE: 'Cat Fact',
		COMMAND_CHOICE_OUTPUT: ({ user, word }) =>
			`🕺 *Eeny, meeny, miny, moe, catch a tiger by the toe...* ${user}, I choose:${codeBlock('', word)}`,
		COMMAND_CHOICE_MISSING: 'Please write at least two options separated by comma.',
		COMMAND_CHOICE_DUPLICATES: ({ words }) => `Why would I accept duplicated words? '${words}'.`,
		COMMAND_DICE_OUTPUT: ({ result }) => `You rolled the dice! You got: **${result}**`,
		COMMAND_DICE_ROLLS_ERROR: 'Amount of rolls must be a number between 1 and 1024.',
		COMMAND_DICE_SIDES_ERROR: 'Amount of sides must be a number between 3 and 1024.',
		COMMAND_ESCAPEROPE_OUTPUT: ({ user }) => `**${user}** used **Escape Rope**`,
		COMMAND_LOVE_LESS45: 'Try again next time...',
		COMMAND_LOVE_LESS75: 'Good enough!',
		COMMAND_LOVE_LESS100: 'Good match!',
		COMMAND_LOVE_100: 'Perfect match!',
		COMMAND_LOVE_ITSELF: 'You are a special creature and you should love yourself more than anyone <3',
		COMMAND_LOVE_RESULT: 'Result',
		COMMAND_MARKOV_TIMER: ({ timer }) => `Processed in ${timer}.`,
		COMMAND_MARKOV_NO_MESSAGES: 'The channel or user has no messages.',
		COMMAND_NORRIS_OUTPUT: 'Chuck Norris',
		COMMAND_RATE_OUTPUT: ({ author, userToRate, rate, emoji }) =>
			`**${author}**, Uhm... le daría a **${userToRate}** un **${rate}**/100 ${emoji}`,
		COMMAND_RATE_MYSELF: ['I love myself a lot 😊', 'myself'],
		COMMAND_PUN_ERROR: 'Something went wrong. Try again later.',
		COMMAND_XKCD_COMICS: ({ amount }) => `There are only ${amount} comics.`,
		COMMAND_XKCD_NOTFOUND: 'I have searched far and wide, but I got no luck finding this comic, try again later or try another!',

		/**
		 * ##############
		 * GAMES COMMANDS
		 */

		COMMAND_GAMES_SKYRA: 'I am sorry, I know you want to play with me, but if I do, I will not be able to help other people! 💔',
		COMMAND_GAMES_BOT: 'I am sorry, but I do not think they would like to stop doing what they are doing and play with humans.',
		COMMAND_GAMES_SELF: 'You must be so sad to play against yourself. Try again with another user.',
		COMMAND_GAMES_PROGRESS: 'I am sorry, but there is a game in progress in this channel, try again when it finishes.',
		COMMAND_GAMES_NO_PLAYERS: ({ prefix }) =>
			`Please specify some tributes to play the Hunger Games, like so: \`${prefix}hg Bob, Mark, Jim, Kyra\``,
		COMMAND_GAMES_TOO_MANY_OR_FEW: ({ min, max }) => `I am sorry but the amount of players is less than ${min} or greater than ${max}.`,
		COMMAND_GAMES_REPEAT: 'I am sorry, but a user cannot play twice.',
		COMMAND_GAMES_PROMPT_TIMEOUT: 'I am sorry, but the challengee did not reply on time.',
		COMMAND_GAMES_PROMPT_DENY: 'I am sorry, but the challengee refused to play.',
		COMMAND_GAMES_TIMEOUT: '**The match concluded in a draw due to lack of a response (60 seconds)**',
		COMMAND_C4_PROMPT: ({ challenger, challengee }) =>
			`Dear ${challengee}, you have been challenged by ${challenger} in a Connect-Four match. Reply with **yes** to accept!`,
		COMMAND_C4_START: ({ player }) => `Let's play! Turn for: **${player}**.`,
		COMMAND_C4_GAME_COLUMN_FULL: 'This column is full. Please try another. ',
		COMMAND_C4_GAME_WIN: ({ user, turn }) => `${user} (${turn === 0 ? 'blue' : 'red'}) won!`,
		COMMAND_C4_GAME_DRAW: 'This match concluded in a **draw**!',
		COMMAND_C4_GAME_NEXT: ({ user, turn }) => `Turn for: ${user} (${turn === 0 ? 'blue' : 'red'}).`,
		COMMAND_C4_DESCRIPTION: 'Play Connect-Four with somebody.',
		COMMAND_C4_EXTENDED: {
			extendedHelp: `This game is better played on PC. Connect Four (also known as Captain's Mistress, Four Up, Plot
					Four, Find Four, Four in a Row, Four in a Line and Gravitrips (in Soviet Union)) is a two-player connection
					game in which the players first choose a color and then take turns dropping colored discs from the top into a
					seven-column, ~~six~~ five-row vertically suspended grid.`
		},
		COMMAND_COINFLIP_DESCRIPTION: 'Flip a coin!',
		COMMAND_COINFLIP_EXTENDED: {
			extendedHelp: `Flip a coin. If you guess the side that shows up, you get back your wager, doubled.
				If you don't, you lose your wager.
				You can also run a cashless flip, which doesn't cost anything, but also doesn't reward you with anything.
				Now get those coins flippin'.`,
			examples: ['heads 50', 'tails 200']
		},
		COMMAND_COINFLIP_INVALID_COINNAME: ({ arg }) => `Excuse me, but ${arg} is not a coin face!`,
		COMMAND_COINFLIP_COINNAMES: ['Heads', 'Tails'],
		COMMAND_COINFLIP_WIN_TITLE: 'You won!',
		COMMAND_COINFLIP_LOSE_TITLE: 'You lost.',
		COMMAND_COINFLIP_NOGUESS_TITLE: 'You flipped a coin.',
		COMMAND_COINFLIP_WIN_DESCRIPTION: ({ result, wager }) =>
			`The coin was flipped, and it showed ${result}. ${wager ? `You guessed correctly and won ${wager} ${SHINY}` : 'You got it right'}!`,
		COMMAND_COINFLIP_LOSE_DESCRIPTION: ({ result, wager }) =>
			`The coin was flipped, and it showed ${result}. You didn\'t guess corectly ${wager ? `and lost ${wager} ${SHINY}` : ''}.`,
		COMMAND_COINFLIP_NOGUESS_DESCRIPTION: ({ result }) => `The coin was flipped, and it showed ${result}.`,
		COMMAND_HIGHERLOWER_DESCRIPTION: 'Play a game of Higher/Lower',
		COMMAND_HIGHERLOWER_EXTENDED: {
			extendedHelp: `Higher/Lower is a game of luck. I will pick a number and you'll have to guess if the next number I pick will be **higher** or **lower** than the current one, using the ⬆ or ⬇ emojis
			Your winnings increase as you progress through the rounds, and you can cashout any time by pressing the 💰 reaction emoji.
			Be warned tho! The further you go, the more chances you have to lose the winnings.`
		},
		COMMAND_HIGHERLOWER_LOADING: `${LOADING} Starting a new game of Higher/Lower.`,
		COMMAND_HIGHERLOWER_NEWROUND: 'Alright. Starting new round.',
		COMMAND_HIGHERLOWER_EMBED: {
			TITLE: ({ turn }) => `Higher or Lower? | Turn ${turn}`,
			DESCRIPTION: ({ number }) => `Your number is ${number}. Will the next number be higher or lower?`,
			FOOTER: 'The game will expire in 3 minutes, so act fast!'
		},
		COMMAND_HIGHERLOWER_LOSE: {
			TITLE: 'You lost!',
			DESCRIPTION: ({ number, losses }) => `You didn't quite get it. The number was ${number}. You lost ${losses} ${SHINY}.`,
			FOOTER: 'Better luck next time!'
		},
		COMMAND_HIGHERLOWER_WIN: {
			TITLE: 'You won!',
			DESCRIPTION: ({ potentials, number }) =>
				`The number was ${number}. Want to continue? With another attempt, you can win ${potentials} ${SHINY}!`,
			FOOTER: "Act fast! You don't have much time."
		},
		COMMAND_HIGHERLOWER_CANCEL: {
			TITLE: 'Game cancelled by choice',
			DESCRIPTION: ({ username }) => `Thanks for playing, ${username}! I'll be here when you want to play again.`
		},
		COMMAND_HIGHERLOWER_CASHOUT: ({ amount }) => `Paid out ${amount} ${SHINY} to your account. Hope you had fun!`,
		COMMAND_HUNGERGAMES_RESULT_HEADER: ({ game }) => (game.bloodbath ? 'Bloodbath' : game.sun ? `Day ${game.turn}` : `Night ${game.turn}`),
		COMMAND_HUNGERGAMES_RESULT_DEATHS: ({ deaths }) => `**${deaths} cannon ${deaths === 1 ? 'shot' : 'shots'} can be heard in the distance.**`,
		COMMAND_HUNGERGAMES_RESULT_PROCEED: 'Proceed?',
		COMMAND_HUNGERGAMES_STOP: 'Game finished by choice! See you later!',
		COMMAND_HUNGERGAMES_WINNER: ({ winner }) => `And the winner is... ${winner}!`,
		COMMAND_HUNGERGAMES_DESCRIPTION: 'Play Hunger Games with your friends!',
		COMMAND_HUNGERGAMES_EXTENDED: {
			extendedHelp: 'Enough discussion, let the games begin!',
			examples: ['Skyra, Katniss, Peeta, Clove, Cato, Johanna, Brutus, Blight']
		},
		COMMAND_SLOTMACHINE_DESCRIPTION: `I bet 100 ${SHINY}'s you ain't winning this round.`,
		COMMAND_SLOTMACHINE_EXTENDED: {
			extendedHelp: `A slot machine (American English), known variously as a fruit machine (British English), puggy
					(Scottish English), the slots (Canadian and American English), poker machine/pokies (Australian English and
					New Zealand English), or simply slot (American English), is a casino gambling machine with three or more
					reels which spin when a button is pushed.`,
			explainedUsage: [['Amount', `Either 50, 100, 200, 500, or even, 1000 ${SHINY} to bet.`]],
			reminder: 'You will receive at least 5 times the amount (cherries/tada) at win, and up to 24 times (seven, diamond without skin).'
		},
		COMMAND_SLOTMACHINES_WIN: ({ roll, winnings }) => `**You rolled:**\n${roll}\n**Congratulations!**\nYou won ${winnings}${SHINY}!`,
		COMMAND_SLOTMACHINES_LOSS: ({ roll }) => `**You rolled:**\n${roll}\n**Mission failed!**\nWe'll get em next time!`,
		COMMAND_SLOTMACHINE_CANVAS_TEXT: ({ won }) => (won ? 'You won' : 'You lost'),
		COMMAND_SLOTMACHINE_TITLES: {
			PREVIOUS: 'Previous',
			NEW: 'New'
		},
		COMMAND_TICTACTOE_DESCRIPTION: 'Play Tic-Tac-Toe with somebody.',
		COMMAND_TICTACTOE_EXTENDED: {
			extendedHelp: `Tic-tac-toe (also known as noughts and crosses or Xs and Os) is a paper-and-pencil game for two
				players, X and O, who take turns marking the spaces in a 3×3 grid. The player who succeeds in placing three of
				their marks in a horizontal, vertical, or diagonal row wins the game.`
		},
		COMMAND_TICTACTOE_PROMPT: ({ challenger, challengee }) =>
			`Dear ${challengee}, you have been challenged by ${challenger} in a Tic-Tac-Toe match. Reply with **yes** to accept!`,
		COMMAND_TICTACTOE_TURN: ({ icon, player, board }) => `(${icon}) Turn for ${player}!\n${board}`,
		COMMAND_TICTACTOE_WINNER: ({ winner, board }) => `Winner is... ${winner}!\n${board}`,
		COMMAND_TICTACTOE_DRAW: ({ board }) => `This match concluded in a **draw**!\n${board}`,
		COMMAND_TRIVIA_DESCRIPTION: 'Play a game of Trivia.',
		COMMAND_TRIVIA_EXTENDED: {
			extendedHelp: [
				'Answer questions of trivia here, with categories ranging from books to mythology! (powered by OpenTDB)',
				'',
				`**Categories**: ${Object.keys(CATEGORIES).join(', ')}`
			].join('\n'),
			explainedUsage: [
				['category', 'The category questions are asked from.'],
				['type', 'The type of question asked: can be boolean (true/false) or multiple choice.'],
				['difficulty', 'The difficulty level of the questions asked.'],
				['duration', 'The amount of time you get to answer.']
			],
			examples: ['trivia history.', 'trivia books multiple easy.', 'trivia videogames 45.'],
			multiline: true
		},
		COMMAND_TRIVIA_INVALID_CATEGORY: 'Invalid category: Please use `Skyra, help trivia` for a list of categories.',
		COMMAND_TRIVIA_ACTIVE_GAME: 'A game of trivia is already being played in this channel',
		COMMAND_TRIVIA_INCORRECT: ({ attempt }) => `I am sorry, but **${attempt}** is not the correct answer. Better luck next time!`,
		COMMAND_TRIVIA_NO_ANSWER: ({ correctAnswer }) => `Looks like nobody got it! The right answer was **${correctAnswer}**.`,
		COMMAND_TRIVIA_EMBED_TITLES: {
			TRIVIA: 'Trivia',
			DIFFICULTY: 'Difficulty'
		},
		COMMAND_TRIVIA_WINNER: ({ winner, correctAnswer }) => `We have a winner! ${winner} had a right answer with **${correctAnswer}**!`,
		COMMAND_VAULT_DESCRIPTION: `Store your ${SHINY}'s securily in a vault so you cannot accidentally spend them gambling.`,
		COMMAND_VAULT_EXTENDED: {
			extendedHelp: `This is for the greedy spenders among us that tend to play a bit too much at the slot machine or
				spin the wheel of fortune. You need to actively withdraw ${SHINY}'s from your vault before they can be spend gambling.`,
			explainedUsage: [
				['action', 'The action to perform: **withdraw** to withdraw from your vault or **deposit** to deposit into your vault.'],
				['money', `The amount of ${SHINY}'s to withdraw or deposit.`]
			],
			examples: ['deposit 10000.', 'withdraw 10000.']
		},
		COMMAND_VAULT_EMBED_DATA: {
			DEPOSITED_DESCRIPTION: ({ coins }) => `Deposited ${coins} ${SHINY} from your account balance into your vault.`,
			WITHDREW_DESCRIPTION: ({ coins }) => `Withdrew ${coins} ${SHINY}\ from your vault.`,
			SHOW_DESCRIPTION: 'Your current account and vault balance are:',
			ACCOUNT_MONEY: 'Account Money',
			ACCOUNT_VAULT: 'Account Vault'
		},
		COMMAND_VAULT_INVALID_COINS: 'I am sorry, but that is an invalid amount of coins. Be sure it is a positive number!',
		COMMAND_VAULT_NOT_ENOUGH_MONEY: ({ money }) =>
			`I am sorry, but you do not have enough money to make that deposit! Your current money balance is ${money} ${SHINY}`,
		COMMAND_VAULT_NOT_ENOUGH_IN_VAULT: ({ vault }) =>
			`I am sorry, but you do not have enough money in your vault to make that withdrawal! Your current vault balance is ${vault} ${SHINY}`,
		COMMAND_WHEELOFFORTUNE_DESCRIPTION: 'Gamble your shinies by spinning a wheel of fortune',
		COMMAND_WHEELOFFORTUNE_EXTENDED: {
			extendedHelp: `You can lose 0.1, 0.2, 0.3 or 0.5 times your input
				or win 1.2, 1.5, 1.7 or 2.4 times your input`
		},
		COMMAND_WHEELOFFORTUNE_TITLES: {
			PREVIOUS: 'Previous',
			NEW: 'New'
		},
		COMMAND_WHEELOFFORTUNE_CANVAS_TEXT: ({ won }) => (won ? 'You won' : 'You lost'),
		GAMES_NOT_ENOUGH_MONEY: ({ money }) =>
			`I am sorry, but you do not have enough money to pay your bet! Your current account balance is ${money} ${SHINY}`,
		GAMES_CANNOT_HAVE_NEGATIVE_MONEY: `You cannot have a negative amount of ${SHINY}s`,

		/**
		 * #################
		 * GIVEAWAY COMMANDS
		 */

		GIVEAWAY_TIME: 'A giveaway must last at least 10 seconds.',
		GIVEAWAY_TIME_TOO_LONG: "Hey! That's an incredibly long time to keep track of!",
		GIVEAWAY_ENDS_AT: 'Ends at:',
		GIVEAWAY_DURATION: ({ time }) => `This giveaway ends in **${duration(time)}**! React to this message with 🎉 to join.`,
		GIVEAWAY_TITLE: '🎉 **GIVEAWAY** 🎉',
		GIVEAWAY_LASTCHANCE: ({ time }) => `**LAST CHANCE**! Remaining time: **${duration(time)}**. React to this message with 🎉 to join.`,
		GIVEAWAY_LASTCHANCE_TITLE: '🎉 **LAST CHANCE GIVEAWAY** 🎉',
		GIVEAWAY_ENDED: ({ winners }) => (winners.length === 1 ? `Winner: ${winners[0]}` : `Winners: ${winners.join(' ')}`),
		GIVEAWAY_ENDED_NO_WINNER: 'No winner...',
		GIVEAWAY_ENDED_AT: 'Ended at:',
		GIVEAWAY_ENDED_TITLE: '🎉 **GIVEAWAY ENDED** 🎉',
		GIVEAWAY_ENDED_MESSAGE: ({ winners, title }) => `Congratulations ${winners.join(' ')}! You won the giveaway **${title}**`,
		GIVEAWAY_ENDED_MESSAGE_NO_WINNER: ({ title }) => `The giveaway **${title}** ended without enough participants.`,
		GIVEAWAY_SCHEDULED: ({ scheduledTime }) => `The giveaway will start in ${duration(scheduledTime)}.`,

		/**
		 * ###################
		 * MANAGEMENT COMMANDS
		 */

		COMMAND_NICK_SET: ({ nickname }) => `Changed the nickname to **${nickname}**.`,
		COMMAND_NICK_CLEARED: 'Nickname cleared.',
		COMMAND_PERMISSIONNODES_HIGHER: `${REDCROSS} You cannot modify nor preview the permission nodes for this target.`,
		COMMAND_PERMISSIONNODES_INVALID_TYPE: `${REDCROSS} Invalid type, expected either of \`allow\` or \`deny\`.`,
		COMMAND_PERMISSIONNODES_ADD: `${GREENTICK} Successfully added the command to the permission node.`,
		COMMAND_PERMISSIONNODES_NODE_NOT_EXISTS: `${REDCROSS} The selected permission node does not exist.`,
		COMMAND_PERMISSIONNODES_COMMAND_NOT_EXISTS: `${REDCROSS} The selected command does not exist in the permision node.`,
		COMMAND_PERMISSIONNODES_REMOVE: `${GREENTICK} Successfully removed the command from the permission node.`,
		COMMAND_PERMISSIONNODES_RESET: `${GREENTICK} Successfully removed all commands from the permission node.`,
		COMMAND_PERMISSIONNODES_SHOW: ({ name, allow, deny }) =>
			[
				`Permissions for: __${name}__`,
				`**Allow**: ${allow.length ? allow.join(', ') : 'None'}`,
				`**Deny**: ${deny.length ? deny.join(', ') : 'None'}`
			].join('\n'),
		COMMAND_TRIGGERS_NOTYPE: 'You need to insert a trigger type (**alias**|**reaction**)',
		COMMAND_TRIGGERS_NOOUTPUT: 'You need to insert the trigger output.',
		COMMAND_TRIGGERS_INVALIDREACTION: 'This reaction does not seem valid for me, either it is not valid unicode or I do not have access to it.',
		COMMAND_TRIGGERS_INVALIDALIAS: 'There is no command like this.',
		COMMAND_TRIGGERS_REMOVE_NOTTAKEN: 'There is no trigger with this input.',
		COMMAND_TRIGGERS_REMOVE: 'Successfully removed this trigger.',
		COMMAND_TRIGGERS_ADD_TAKEN: 'There is already a trigger with this input.',
		COMMAND_TRIGGERS_ADD: 'Successfully added the trigger.',
		COMMAND_TRIGGERS_LIST_EMPTY: 'The trigger list for this guild is empty.',
		COMMAND_SERVERINFO_TITLES: {
			CHANNELS: 'Channels',
			MEMBERS: 'Members',
			OTHER: 'Other'
		},
		COMMAND_SERVERINFO_ROLES: ({ roles }) => `**Roles**\n\n${roles}`,
		COMMAND_SERVERINFO_NOROLES: 'Roles? Where? There is no other than the `@everyone` role!',
		COMMAND_SERVERINFO_CHANNELS: ({ text, voice, categories, afkChannel, afkTime }) =>
			[
				`• **${text}** Text, **${voice}** Voice, **${categories}** categories.`,
				`• AFK: ${afkChannel ? `**<#${afkChannel}>** after **${afkTime / 60}**min` : '**None**.'}`
			].join('\n'),
		COMMAND_SERVERINFO_MEMBERS: ({ count, owner }) =>
			[`• **${count}** members`, `• Owner: **${owner.tag}**`, `  (ID: **${owner.id}**)`].join('\n'),
		COMMAND_SERVERINFO_OTHER: ({ size, region, createdAt, verificationLevel }) =>
			[
				`• Roles: **${size}**`,
				`• Region: **${region}**`,
				`• Created at: **${timestamp.displayUTC(createdAt)}** (UTC - YYYY/MM/DD)`,
				`• Verification Level: **${this.HUMAN_LEVELS[verificationLevel]}**`
			].join('\n'),
		COMMAND_ROLEINFO_TITLES: { PERMISSIONS: 'Permissions' },
		COMMAND_ROLEINFO: ({ role }) =>
			[
				`ID: **${role.id}**`,
				`Name: **${role.name}**`,
				`Color: **${role.hexColor}**`,
				`Hoisted: **${role.hoist ? 'Yes' : 'No'}**`,
				`Position: **${role.rawPosition}**`,
				`Mentionable: **${role.mentionable ? 'Yes' : 'No'}**`
			].join('\n'),
		COMMAND_ROLEINFO_ALL: 'All Permissions granted.',
		COMMAND_ROLEINFO_PERMISSIONS: ({ permissions }) =>
			permissions.length > 0 ? permissions.map((key) => `+ **${PERMS[key]}**`).join('\n') : 'Permissions not granted.',
		COMMAND_FILTER_UNDEFINED_WORD: 'You must write what you want me to filter.',
		COMMAND_FILTER_FILTERED: ({ filtered }) => `This word is ${filtered ? 'already' : 'not'} filtered.`,
		COMMAND_FILTER_ADDED: ({ word }) => `| ✅ | Success! Added the word ${word} to the filter.`,
		COMMAND_FILTER_REMOVED: ({ word }) => `| ✅ | Success! Removed the word ${word} from the filter.`,
		COMMAND_FILTER_RESET: '| ✅ | Success! The filter has been reset.',
		COMMAND_FILTER_SHOW_EMPTY: 'The list of filtered words is empty!',
		COMMAND_FILTER_SHOW: ({ words }) => `Filtered words in this server: ${words}`,
		COMMAND_MANAGEATTACHMENTS_REQUIRED_VALUE: 'You must input a value for this type.',
		COMMAND_MANAGEATTACHMENTS_INVALID_ACTION: 'The type must be `ban`, `kick`, `mute`, or `softban`.',
		COMMAND_MANAGEATTACHMENTS_MAXIMUM: ({ value }) => `${GREENTICK} Successfully set the maximum amount of attachments to ${value}.`,
		COMMAND_MANAGEATTACHMENTS_EXPIRE: ({ value }) =>
			`${GREENTICK} Successfully set the lifetime for the manager's entries to ${duration(value)}.`,
		COMMAND_MANAGEATTACHMENTS_DURATION: ({ value }) => `${GREENTICK} Successfully set the duration for moderation logs to ${duration(value)}.`,
		COMMAND_MANAGEATTACHMENTS_ACTION: `${GREENTICK} Successfully changed the moderative action for the manager.`,
		COMMAND_MANAGEATTACHMENTS_LOGS: `${GREENTICK} Successfully changed the preferences for message logging.`,
		COMMAND_MANAGEATTACHMENTS_ENABLED: ({ value }) => `${GREENTICK} Successfully ${value ? 'enabled' : 'disabled'} the attachment management.`,

		/**
		 * #################################
		 * MANAGEMENT/CONFIGURATION COMMANDS
		 */

		COMMAND_MANAGECOMMANDAUTODELETE_TEXTCHANNEL:
			'You must input a valid text channel, people cannot use commands in a voice or a category channel!',
		COMMAND_MANAGECOMMANDAUTODELETE_REQUIRED_DURATION: 'You must specify an amount of seconds for the command to be automatically deleted.',
		COMMAND_MANAGECOMMANDAUTODELETE_SHOW_EMPTY: 'There are no command autodelete configured right now.',
		COMMAND_MANAGECOMMANDAUTODELETE_SHOW: ({ codeblock }) => `All command autodeletes configured:${codeblock}`,
		COMMAND_MANAGECOMMANDAUTODELETE_ADD: ({ channel, time }) =>
			`${GREENTICK} Success! All successful commands in ${channel} will be deleted after ${duration(time)}!`,
		COMMAND_MANAGECOMMANDAUTODELETE_REMOVE: ({ channel }) =>
			`${GREENTICK} Success! Commands will not be automatically deleted in ${channel} anymore!`,
		COMMAND_MANAGECOMMANDAUTODELETE_REMOVE_NOTSET: ({ channel }) =>
			`${REDCROSS} The channel ${channel} was not configured to automatically delete messages!`,
		COMMAND_MANAGECOMMANDAUTODELETE_RESET: 'All the command autodeletes have been reset.',
		COMMAND_MANAGECOMMANDCHANNEL_TEXTCHANNEL: 'You must input a valid text channel, people cannot use commands in a voice or a category channel!',
		COMMAND_MANAGECOMMANDCHANNEL_REQUIRED_COMMAND: "You must specify what command do you want to add or remove from the channel's filter.",
		COMMAND_MANAGECOMMANDCHANNEL_SHOW: ({ channel, commands }) => `List of disabled commands in ${channel}: ${commands}`,
		COMMAND_MANAGECOMMANDCHANNEL_SHOW_EMPTY: 'The list of disabled commands for the specified channel is empty!',
		COMMAND_MANAGECOMMANDCHANNEL_ADD_ALREADYSET: 'The command you are trying to disable is already disabled!',
		COMMAND_MANAGECOMMANDCHANNEL_ADD: ({ channel, command }) => `Successfully disabled the command ${command} for the channel ${channel}!`,
		COMMAND_MANAGECOMMANDCHANNEL_REMOVE_NOTSET: ({ channel }) => `The command you are trying to enable was not disabled for ${channel}.`,
		COMMAND_MANAGECOMMANDCHANNEL_REMOVE: ({ channel, command }) => `Successfully enabled the command ${command} for the channel ${channel}!`,
		COMMAND_MANAGECOMMANDCHANNEL_RESET_EMPTY: 'This channel had no disabled command, so I decided to do nothing.',
		COMMAND_MANAGECOMMANDCHANNEL_RESET: ({ channel }) => `Successfully enabled all disabled commands in ${channel}, enjoy!`,
		COMMAND_MANAGEREACTIONROLES_SHOW_EMPTY: 'There are no reaction roles set up in this server.',
		COMMAND_MANAGEREACTIONROLES_ADD_CHANNEL: ({ emoji, channel }) =>
			`${GREENTICK} Success! I will now give the role when people react with ${emoji} to any message from ${channel}!`,
		COMMAND_MANAGEREACTIONROLES_ADD_PROMPT: 'Listening now! Please react to a message and I will bind the reaction with the role!',
		COMMAND_MANAGEREACTIONROLES_ADD_MISSING: 'I waited, but you did not seem to have reacted to a message.',
		COMMAND_MANAGEREACTIONROLES_ADD: ({ emoji, url }) =>
			`${GREENTICK} Success! I will now give the role when people react with ${emoji} at ${url}!`,
		COMMAND_MANAGEREACTIONROLES_REMOVE_NOTEXISTS: 'The reaction role you specified does not exist.',
		COMMAND_MANAGEREACTIONROLES_REMOVE: ({ emoji, url }) =>
			`${GREENTICK} Success! I will not longer give the role when people react with ${emoji} at ${url}!`,
		COMMAND_MANAGEREACTIONROLES_RESET_EMPTY: 'There were no reaction roles set up.',
		COMMAND_MANAGEREACTIONROLES_RESET: `${GREENTICK} Successfully removed all reaction roles.`,
		COMMAND_SETSTARBOARDEMOJI_SET: ({ emoji }) => `Successfully set a new emoji for the next star messages: ${emoji}`,
		CONFIGURATION_TEXTCHANNEL_REQUIRED: 'The selected channel is not a valid text channel, try again with another.',
		CONFIGURATION_EQUALS: 'Successfully configured: no changes were made.',
		COMMAND_SETIGNORECHANNELS_SET: ({ channel }) => `Ignoring all command input from ${channel} now.`,
		COMMAND_SETIGNORECHANNELS_REMOVED: ({ channel }) => `Listening all command input from ${channel} now.`,
		COMMAND_SETIMAGELOGS_SET: ({ channel }) => `Successfully set the image logs channel to ${channel}.`,
		COMMAND_SETMEMBERLOGS_SET: ({ channel }) => `Successfully set the member logs channel to ${channel}.`,
		COMMAND_SETMESSAGELOGS_SET: ({ channel }) => `Successfully set the message logs channel to ${channel}.`,
		COMMAND_SETMODLOGS_SET: ({ channel }) => `Successfully set the mod logs channel to ${channel}.`,
		COMMAND_SETPREFIX_SET: ({ prefix }) => `Successfully set the prefix to ${prefix}. Use ${prefix}setPrefix <prefix> to change it again.`,

		/**
		 * ###########################
		 * MANAGEMENT/MEMBERS COMMANDS
		 */

		COMMAND_STICKYROLES_REQUIRED_USER: 'A user target is required for this command to work.',
		COMMAND_STICKYROLES_REQUIRED_ROLE: 'A role name is required when adding or removing a role.',
		COMMAND_STICKYROLES_NOTEXISTS: ({ user }) => `The user ${user} does not have any sticky roles or does not have the specified one.`,
		COMMAND_STICKYROLES_RESET: ({ user }) => `Successfully removed all sticky roles from ${user}.`,
		COMMAND_STICKYROLES_REMOVE: ({ user }) => `Successfully removed the specified role from ${user}.`,
		COMMAND_STICKYROLES_ADD_EXISTS: ({ user }) => `The user ${user} already had the specified role as sticky.`,
		COMMAND_STICKYROLES_ADD: ({ user }) => `Successfully added the specified role as sticky to ${user}.`,
		COMMAND_STICKYROLES_SHOW_EMPTY: 'There are no sticky roles to show.',
		COMMAND_STICKYROLES_SHOW_SINGLE: ({ user, roles }) => `Sticky Role(s) for **${user}**: \`${roles.join('`, `')}\`.`,

		/**
		 * #############
		 * MISC COMMANDS
		 */

		COMMAND_RANDREDDIT_REQUIRED_REDDIT: 'You must give the name of a reddit.',
		COMMAND_RANDREDDIT_INVALID_ARGUMENT: `${REDCROSS} The name you gave was not a valid name for a subreddit.`,
		COMMAND_RANDREDDIT_BANNED: 'This reddit is banned and should not be used.',
		COMMAND_RANDREDDIT_FAIL: 'I failed to retrieve data, are you sure you wrote the reddit correctly?',
		COMMAND_RANDREDDIT_ALL_NSFW: 'Nothing could be posted as all retrieved posts are NSFW.',
		COMMAND_RANDREDDIT_ALL_NSFL: 'Nothing could be posted as all retrieved posts are NSFL. You do not want to see that.',
		COMMAND_RANDREDDIT_MESSAGE: ({ title, author, url }) => `**${title}** submitted by ${author}\n${url}`,
		COMMAND_RANDREDDIT_ERROR_PRIVATE: `${REDCROSS} No data could be downloaded as the subreddit is marked as private.`,
		COMMAND_RANDREDDIT_ERROR_QUARANTINED: `${REDCROSS} No data could be downloaded as the subreddit is marked as quarantined.`,
		COMMAND_RANDREDDIT_ERROR_NOT_FOUND: `${REDCROSS} No data could be downloaded as the subreddit does not exist.`,
		COMMAND_RANDREDDIT_ERROR_BANNED: `${REDCROSS} No data could be downloaded as the subreddit is marked as banned.`,
		COMMAND_REDDITUSER_COMPLEXITY_LEVELS: ['very low', 'low', 'medium', 'high', 'very high', 'very high'],
		COMMAND_REDDITUSER_INVALID_USER: ({ user }) => `\`${user}\` is not a valid Reddit username`,
		COMMAND_REDDITUSER_QUERY_FAILED: "Couldn't find any data for that reddit user",
		COMMAND_REDDITUSER_TITLES: {
			LINK_KARMA: 'Link Karma',
			COMMENT_KARMA: 'Comment Karma',
			TOTAL_COMMENTS: 'Total Comments',
			TOTAL_SUBMISSIONS: 'Total Submissions',
			COMMENT_CONTROVERSIALITY: 'Comment Controversiality',
			TEXT_COMPLEXITY: 'Text Complexity',
			TOP_5_SUBREDDITS: 'Top 5 Subreddits',
			BY_SUBMISSIONS: 'by submission',
			BY_COMMENTS: 'by comments',
			BEST_COMMENT: 'Best Comment',
			WORST_COMMENT: 'Worst Comment'
		},
		COMMAND_REDDITUSER_DATA: {
			OVERVIEW_FOR: ({ user }) => `Overview for /u/${user}`,
			PERMALINK: 'Permalink',
			DATA_AVAILABLE_FOR: 'Data is available for the past 1000 comments and submissions (Reddit API limitation)',
			JOINED_REDDIT: ({ timestamp }) => `Joined Reddit ${timestamp}`
		},
		COMMAND_SNIPE_EMPTY: 'There are no sniped messages in this channel.',
		COMMAND_SNIPE_TITLE: 'Sniped Message',
		COMMAND_UPVOTE_MESSAGE:
			'Here is the link: **<https://botsfordiscord.com/bot/266624760782258186>**! Some perks for upvoters are coming very soon! Remember, you can vote every 24 hours.',
		COMMAND_VAPORWAVE_OUTPUT: ({ str }) => `Here is your converted message:\n${str}`,

		/**
		 * #############################
		 * MODERATION/UTILITIES COMMANDS
		 */

		COMMAND_PERMISSIONS: ({ username, id }) => `Permissions for ${username} (${id})`,
		COMMAND_PERMISSIONS_ALL: 'All Permissions',
		COMMAND_RAID_DISABLED: 'The Anti-RAID system is not enabled in this server.',
		COMMAND_RAID_MISSING_KICK: `As I do not have the **${PERMS.KICK_MEMBERS}** permission, I will keep the Anti-RAID unactivated.`,
		COMMAND_RAID_LIST: 'List of users in the RAID queue',
		COMMAND_RAID_CLEAR: 'Successfully cleared the RAID list.',
		COMMAND_RAID_COOL: 'Successfully deactivated the RAID.',
		COMMAND_FLOW: ({ amount }) => `${amount} messages have been sent within the last minute.`,
		COMMAND_TIME_TIMED: 'The selected moderation case has already been timed.',
		COMMAND_TIME_UNDEFINED_TIME: 'You must specify a time.',
		COMMAND_TIME_UNSUPPORTED_TIPE: 'The type of action for the selected case cannot be reverse, therefore this action is unsupported.',
		COMMAND_TIME_NOT_SCHEDULED: 'This task is not scheduled.',
		COMMAND_TIME_ABORTED: ({ title }) => `Successfully aborted the schedule for ${title}`,
		COMMAND_TIME_SCHEDULED: ({ title, user, time }) =>
			`✅ Successfully scheduled a moderation action type **${title}** for the user ${user.tag} (${user.id}) with a duration of ${duration(
				time
			)}`,

		/**
		 * ###################
		 * MODERATION COMMANDS
		 */

		COMMAND_SLOWMODE_SET: ({ cooldown }) =>
			cooldown === 0 ? 'The cooldown for this channel has been reset.' : `The cooldown for this channel has been set to ${duration(cooldown)}.`,
		COMMAND_SLOWMODE_TOO_LONG: `${REDCROSS} The maximum amount of time you can set is 6 hours.`,
		COMMAND_BAN_NOT_BANNABLE: 'The target is not bannable for me.',
		COMMAND_DEHOIST_EMBED: {
			TITLE: ({ users }) => `Finished dehoisting ${users} members`,
			DESCRIPTION_NOONE: 'No members were dehoisted. A round of applause for your law-abiding users!',
			DESCRIPTION_WITHERRORS: ({ users, errored }) =>
				`${users} member${users === 1 ? '' : 's'} ${
					users === 1 ? 'was' : 'were'
				} dehoisted. We also tried to dehoist an additional ${errored} member${users === 1 ? '' : 's'}, but they errored out`,
			DESCRIPTION: ({ users }) => `${users} member${users === 1 ? '' : 's'} ${users === 1 ? 'was' : 'were'} dehoisted`,
			FIELD_ERROR_TITLE: 'The users we encountered an error for:'
		},
		COMMAND_KICK_NOT_KICKABLE: 'The target is not kickable for me.',
		COMMAND_LOCKDOWN_LOCK: ({ channel }) => `The channel ${channel} is now locked.`,
		COMMAND_LOCKDOWN_LOCKING: ({ channel }) => `${LOADING} Locking the channel ${channel}... I might not be able to reply after this.`,
		COMMAND_LOCKDOWN_LOCKED: ({ channel }) => `The channel ${channel} was already locked.`,
		COMMAND_LOCKDOWN_UNLOCKED: ({ channel }) => `The channel ${channel} was not locked.`,
		COMMAND_LOCKDOWN_OPEN: ({ channel }) => `The lockdown for the channel ${channel} has been released.`,
		COMMAND_MUTE_LOWLEVEL: 'I am sorry, there is no Mute role configured. Please ask an Administrator or the Guild Owner to set it up.',
		COMMAND_MUTE_CONFIGURE_CANCELLED: 'Prompt aborted, the Mute role creation has been cancelled.',
		COMMAND_MUTE_CONFIGURE: 'Do you want me to create and configure the Mute role now?',
		COMMAND_MUTE_CONFIGURE_TOOMANY_ROLES: 'There are too many roles (250). Please delete a role before proceeding.',
		COMMAND_MUTE_MUTED: 'The target user is already muted.',
		COMMAND_MUTE_USER_NOT_MUTED: 'This user is not muted.',
		COMMAND_MUTE_UNCONFIGURED: 'This guild does not have a **Muted** role. Aborting command execution.',
		COMMAND_MUTECREATE_MISSING_PERMISSION: `I need the **${PERMS.MANAGE_ROLES}** permission to create the role and **${PERMS.MANAGE_CHANNELS}** to edit the channels permissions.`,
		COMMAND_RESTRICT_LOWLEVEL: `${REDCROSS} I am sorry, there is no restriction role configured. Please ask an Administrator or the server owner to set i up.`,
		COMMAND_PRUNE_INVALID: `${REDCROSS} You did not specify the arguments correctly, please make sure you gave a correct limit or filter.`,
		COMMAND_PRUNE: ({ amount, total }) => `Successfully deleted ${amount} ${amount === 1 ? 'message' : 'messages'} from ${total}.`,
		COMMAND_PRUNE_INVALID_POSITION: `${REDCROSS} Position must be one of "before" or "after".`,
		COMMAND_PRUNE_INVALID_FILTER: `${REDCROSS} Filter must be one of "file", "author", "bot", "human", "invite", "link", or "skyra".`,
		COMMAND_PRUNE_NO_DELETES: 'No message has been deleted, either no message match the filter or they are over 14 days old.',
		COMMAND_PRUNE_LOG_HEADER:
			'The following messages have been generated by request of a moderator.\nThe date formatting is of `YYYY/MM/DD hh:mm:ss`.',
		COMMAND_PRUNE_LOG_MESSAGE: ({ channel, author, amount }) =>
			`${amount} ${amount === 1 ? 'message' : 'messages'} deleted in ${channel} by ${author}.`,
		COMMAND_PRUNE_POSITIONS: new Map([
			['before', Position.Before],
			['b', Position.Before],
			['after', Position.After],
			['a', Position.After]
		]),
		COMMAND_PRUNE_FILTERS: new Map([
			['file', Filter.Attachments],
			['files', Filter.Attachments],
			['upload', Filter.Attachments],
			['uploads', Filter.Attachments],
			['author', Filter.Author],
			['me', Filter.Author],
			['bot', Filter.Bots],
			['bots', Filter.Bots],
			['human', Filter.Humans],
			['humans', Filter.Humans],
			['invite', Filter.Invites],
			['invites', Filter.Invites],
			['link', Filter.Links],
			['links', Filter.Links],
			['skyra', Filter.Skyra],
			['you', Filter.Skyra]
		]),
		COMMAND_REASON_MISSING_CASE: 'You need to provide a case or a case range.',
		COMMAND_REASON_NOT_EXISTS: ({ range }) => `The selected modlog${range ? 's' : ''} don't seem to exist.`,
		COMMAND_REASON_UPDATED: ({ entries, newReason }) =>
			[
				`${GREENTICK} Updated ${entries.length} case${entries.length === 1 ? '' : 's'}`,
				` └─ **Set ${entries.length === 1 ? 'its reason' : 'their reasons'} to:** ${newReason}`
			].join('\n'),
		COMMAND_TOGGLEMODERATIONDM_TOGGLED: ({ value }) =>
			value ? `${GREENTICK} Successfully enabled moderation DMs.` : `${GREENTICK} Successfully disabled moderation DMs.`,
		COMMAND_UNBAN_MISSING_PERMISSION: `I will need the **${PERMS.BAN_MEMBERS}** permission to be able to unban.`,
		COMMAND_UNMUTE_MISSING_PERMISSION: `I will need the **${PERMS.MANAGE_ROLES}** permission to be able to unmute.`,
		COMMAND_VMUTE_MISSING_PERMISSION: `I will need the **${PERMS.MUTE_MEMBERS}** permission to be able to voice unmute.`,
		COMMAND_VMUTE_USER_NOT_MUTED: 'This user is not voice muted.',
		COMMAND_WARN_DM: ({ moderator, guild, reason }) => `You have been warned by ${moderator} in ${guild} for the reason: ${reason}`,
		COMMAND_WARN_MESSAGE: ({ user, log }) => `|\`🔨\`| [Case::${log}] **WARNED**: ${user.tag} (${user.id})`,
		COMMAND_MODERATION_OUTPUT: ({ cases, range, users, reason }) =>
			`${GREENTICK} Created ${cases.length === 1 ? 'case' : 'cases'} ${range} | ${users.join(', ')}.${
				reason ? `\nWith the reason of: ${reason}` : ''
			}`,
		COMMAND_MODERATION_FAILED: ({ users }) => `${REDCROSS} Failed to moderate ${users.length === 1 ? 'user' : 'users'}:\n${users.join('\n')}`,
		COMMAND_MODERATION_DM: ({ guild, title, reason, duration: pDuration }) => ({
			DESCRIPTION: [
				`**❯ Server**: ${guild}`,
				`**❯ Type**: ${title}`,
				pDuration ? `**❯ Duration**: ${duration(pDuration)}` : null,
				`**❯ Reason**: ${reason || 'None specified'}`
			]
				.filter((line) => line !== null)
				.join('\n'),
			FOOTER: 'To disable moderation DMs, write `toggleModerationDM`.'
		}),
		COMMAND_MODERATION_DAYS: /days?/i,

		/**
		 * ###############
		 * SOCIAL COMMANDS
		 */

		COMMAND_AUTOROLE_POINTS_REQUIRED: 'You must input a valid amount of points.',
		COMMAND_AUTOROLE_UPDATE_CONFIGURED: 'This role is already configured as an autorole. Use the remove type instead.',
		COMMAND_AUTOROLE_UPDATE_UNCONFIGURED: 'This role is not configured as an autorole. Use the add type instead.',
		COMMAND_AUTOROLE_UPDATE: ({ role, points, before }) =>
			`Updated autorole: ${role.name} (${role.id}). Points required: ${points} (before: ${before})`,
		COMMAND_AUTOROLE_REMOVE: ({ role, before }) => `Removed the autorole: ${role.name} (${role.id}), which required ${before} points.`,
		COMMAND_AUTOROLE_ADD: ({ role, points }) => `Added new autorole: ${role.name} (${role.id}). Points required: ${points}`,
		COMMAND_AUTOROLE_LIST_EMPTY: 'There is no role configured as an autorole in this server.',
		COMMAND_AUTOROLE_UNKNOWN_ROLE: ({ role }) => `Unknown role: ${role}`,
		COMMAND_BALANCE: ({ user, amount }) => `The user ${user} has a total of ${amount}${SHINY}`,
		COMMAND_BALANCE_SELF: ({ amount }) => `You have a total of ${amount}${SHINY}`,
		COMMAND_BALANCE_BOTS: `I think they have 5 gears as much, bots don't have ${SHINY}`,
		COMMAND_SOCIAL_MEMBER_NOTEXISTS: `${REDCROSS} The member is not in this server, and is not in my database either.`,
		COMMAND_SOCIAL_ADD: ({ user, amount, added }) =>
			`${GREENTICK} Successfully added ${added} point${added === 1 ? '' : 's'} to ${user}. Current amount: ${amount}.`,
		COMMAND_SOCIAL_REMOVE: ({ user, amount, removed }) =>
			`${GREENTICK} Successfully removed ${removed} point${removed === 1 ? '' : 's'} to ${user}. Current amount: ${amount}.`,
		COMMAND_SOCIAL_UNCHANGED: ({ user }) => `${REDCROSS} The user ${user} already had the given amount of points, no update was needed.`,
		COMMAND_SOCIAL_RESET: ({ user }) => `${GREENTICK} The user ${user} got his points removed.`,
		COMMAND_BANNER_MISSING: ({ type }) => `You must specify a banner id to ${type}.`,
		COMMAND_BANNER_NOTEXISTS: ({ prefix }) =>
			`This banner id does not exist. Please check \`${prefix}banner list\` for a list of banners you can buy.`,
		COMMAND_BANNER_USERLIST_EMPTY: ({ prefix }) =>
			`You did not buy a banner yet. Check \`${prefix}banner list\` for a list of banners you can buy.`,
		COMMAND_BANNER_RESET_DEFAULT: 'You are already using the default banner.',
		COMMAND_BANNER_RESET: 'Your banner has been reset to the default.',
		COMMAND_BANNER_SET_NOT_BOUGHT: 'You did not buy this banner yet.',
		COMMAND_BANNER_SET: ({ banner }) => `|\`✅\`| **Success**. You have set your banner to: __${banner}__`,
		COMMAND_BANNER_BOUGHT: ({ prefix, banner }) =>
			`You already have this banner, you may want to use \`${prefix}banner set ${banner}\` to make it visible in your profile.`,
		COMMAND_BANNER_MONEY: ({ money, cost }) =>
			`You do not have enough money to buy this banner. You have ${money}${SHINY}, the banner costs ${cost}${SHINY}`,
		COMMAND_BANNER_PAYMENT_CANCELLED: '|`❌`| The payment has been cancelled.',
		COMMAND_BANNER_BUY: ({ banner }) => `|\`✅\`| **Success**. You have bought the banner: __${banner}__`,
		COMMAND_BANNER_PROMPT:
			'Reply to this message choosing an option:\n`all` to check a list of all available banners.\n`user` to check a list of all bought banners.',
		COMMAND_TOGGLEDARKMODE_TOGGLED: ({ enabled }) =>
			enabled ? `${GREENTICK} Successfully enabled the dark mode.` : `${GREENTICK} Successfully disabled the dark mode.`,
		COMMAND_DAILY_TIME: ({ time }) => `Next dailies are available in ${duration(time)}`,
		COMMAND_DAILY_TIME_SUCCESS: ({ amount }) => `Yay! You earned ${amount}${SHINY}! Next dailies in: 12 hours.`,
		COMMAND_DAILY_GRACE: ({ remaining }) =>
			[
				'Would you like to claim the dailies early? The remaining time will be added up to a normal 12h wait period.',
				`Remaining time: ${duration(remaining)}`
			].join('\n'),
		COMMAND_DAILY_GRACE_ACCEPTED: ({ amount, remaining }) => `Successfully claimed ${amount}${SHINY}! Next dailies in: ${duration(remaining)}`,
		COMMAND_DAILY_GRACE_DENIED: 'Got it! Come back soon!',
		COMMAND_LEVEL: {
			LEVEL: 'Level',
			EXPERIENCE: 'Experience',
			NEXT_IN: 'Next level in'
		},
		COMMAND_DIVORCE_NOTTAKEN: 'Who would you divorce? You are not even taken!',
		COMMAND_DIVORCE_PROMPT: 'Ooh... that sounds quite bad 💔... are you 100% sure about this?',
		COMMAND_DIVORCE_CANCEL: 'Oh lord. I am very glad you will continue with your partner!',
		COMMAND_DIVORCE_DM: ({ user }) => `Pardon... but... do you remember ${user}? They decided to break up with you 💔!`,
		COMMAND_DIVORCE_SUCCESS: ({ user }) => `Successful divorce 💔... You are no longer married to ${user}!`,
		COMMAND_MARRY_WITH: ({ users }) => `Dear, how could you forget it... You are currently married to ${this.list(users, 'and')}!`,
		COMMAND_MARRY_NOTTAKEN: 'Uh... I am sorry, but I am not aware of you being married... have you tried proposing to somebody?',
		COMMAND_MARRY_SKYRA: 'I am sorry, I know you love me, but I am already taken by a brave man I love 💞!',
		COMMAND_MARRY_SNEYRA: 'In your dreams. She is my sister, I am not letting somebody harm her!',
		COMMAND_MARRY_BOTS: 'Oh no! You should not be marrying bots! They still do not understand what true love is, and they are not warm!',
		COMMAND_MARRY_SELF: 'No! This is not how this works! You cannot marry yourself, who would you spend your life with? 💔',
		COMMAND_MARRY_AUTHOR_TAKEN: ({ author }) =>
			`You are already married. Is your love big enough for two people? <@${author.id}>, reply with **yes** to confirm!`,
		COMMAND_MARRY_AUTHOR_MULTIPLE_CANCEL: ({ user }) => `Cancelling. Your commitment to ${user} is admirable.`,
		COMMAND_MARRY_TAKEN: ({ spousesCount }) =>
			`This user is already married to ${spousesCount === 1 ? 'someone' : `${spousesCount} people`}. Would you like to join their harem?`,
		COMMAND_MARRY_ALREADY_MARRIED: ({ user }) => `You are already married with ${user}, did you forget it?`,
		COMMAND_MARRY_AUTHOR_TOO_MANY: ({ limit }) => `${REDCROSS} You are married to too many people, your maximum is ${limit}!`,
		COMMAND_MARRY_TARGET_TOO_MANY: ({ limit }) =>
			`${REDCROSS} The user you are trying to marry to is already married to too many people, their maximum is ${limit}!`,
		COMMAND_MARRY_MULTIPLE_CANCEL: "Cancelling. Don't worry, you'll find someone you don't have to share!",
		COMMAND_MARRY_PETITION: ({ author, user }) =>
			`Fresh pair of eyes! ${author.username} is proposing to ${user.username}! 💞 <@${user.id}>, reply with **yes** to accept!`,
		COMMAND_MARRY_NOREPLY: 'The user did not reply on time... Maybe it was a hard decision?',
		COMMAND_MARRY_DENIED: 'O-oh... The user rejected your proposal! 💔',
		COMMAND_MARRY_ACCEPTED: ({ author, user }) => `Congratulations dear ${author}! You're now officially married with ${user}! ❤`,
		COMMAND_MYLEVEL: ({ points, next, user }) => `The user ${user} has a total of ${points} points.${next}`,
		COMMAND_MYLEVEL_SELF: ({ points, next }) => `You have a total of ${points} points.${next}`,
		COMMAND_MYLEVEL_NEXT: ({ remaining, next }) => `Points for next rank: **${remaining}** (at ${next} points).`,
		COMMAND_PAY_MISSING_MONEY: ({ needed, has }) => `I am sorry, but you need ${needed}${SHINY} and you have ${has}${SHINY}`,
		COMMAND_PAY_PROMPT: ({ user, amount }) => `You are about to pay ${user} ${amount}${SHINY}, are you sure you want to proceed?`,
		COMMAND_PAY_PROMPT_ACCEPT: ({ user, amount }) => `Payment accepted, ${amount}${SHINY} has been sent to ${user}'s profile.`,
		COMMAND_PAY_PROMPT_DENY: 'Payment denied.',
		COMMAND_PAY_SELF: 'If I taxed this, you would lose money, therefore, do not try to pay yourself.',
		COMMAND_SOCIAL_PAY_BOT: 'Oh, sorry, but money is meaningless for bots, I am pretty sure a human would take advantage of it better.',
		COMMAND_PROFILE: {
			GLOBAL_RANK: 'Global Rank',
			CREDITS: 'Credits | Vault',
			REPUTATION: 'Reputation',
			EXPERIENCE: 'Experience',
			LEVEL: 'Level'
		},
		COMMAND_REMINDME_CREATE: ({ id }) => `A reminder with ID \`${id}\` has been created.`,
		COMMAND_REMINDME_CREATE_NO_DURATION: 'You must tell me what you want me to remind you and when.',
		COMMAND_REMINDME_CREATE_NO_DESCRIPTION: 'Something, you did not tell me what.',
		COMMAND_REMINDME_DELETE_NO_ID: 'You must give a valid ID, you can get them using the `list` sub-command.',
		COMMAND_REMINDME_DELETE: ({ task }) =>
			`The reminder with ID \`${task.id}\` and with a remaining time of **${duration(
				task.time.getTime() - Date.now()
			)}** has been successfully deleted.`,
		COMMAND_REMINDME_LIST_EMPTY: 'You do not have any active reminder',
		COMMAND_REMINDME_SHOW_FOOTER: ({ id }) => `ID: ${id} | Ends at:`,
		COMMAND_REMINDME_INVALID_ID: 'I am sorry, but the ID provided does not seem to be valid.',
		COMMAND_REMINDME_NOTFOUND: 'I cannot find something here. The reminder either never existed or it ended.',

		COMMAND_REPUTATION_TIME: ({ remaining }) => `You can give a reputation point in ${duration(remaining)}`,
		COMMAND_REPUTATION_USABLE: 'You can give a reputation point now.',
		COMMAND_REPUTATION_USER_NOTFOUND: 'You must mention a user to give a reputation point.',
		COMMAND_REPUTATION_SELF: 'You cannot give a reputation point to yourself.',
		COMMAND_REPUTATION_BOTS: 'You cannot give a reputation point to bots.',
		COMMAND_REPUTATION_GIVE: ({ user }) => `You have given a reputation point to **${user}**!`,
		COMMAND_REPUTATIONS_BOTS: 'Bots cannot have reputation points...',
		COMMAND_REPUTATIONS_SELF: ({ points }) => `You have a total of ${points} reputation points.`,
		COMMAND_REPUTATIONS: ({ user, points }) =>
			`The user ${user} has a total of ${points === 1 ? 'one reputation point' : `${points} reputation points`}.`,
		COMMAND_REQUIRE_ROLE: 'I am sorry, but you must provide a role for this command.',
		COMMAND_SCOREBOARD_POSITION: ({ position }) => `Your placing position is: ${position}`,
		COMMAND_SETCOLOR: ({ color }) => `Color changed to ${color}`,
		COMMAND_SOCIAL_PROFILE_NOTFOUND: 'I am sorry, but this user profile does not exist.',
		COMMAND_SOCIAL_PROFILE_BOT: 'I am sorry, but Bots do not have a __Member Profile__.',
		COMMAND_SOCIAL_PROFILE_DELETE: ({ user, points }) =>
			`|\`✅\`| **Success**. Deleted the __Member Profile__ for **${user}**, which had ${points} ${points === 1 ? 'point' : 'points'}.`,
		COMMAND_SOCIAL_POINTS: 'May you specify the amount of points you want to add or remove?',
		COMMAND_SOCIAL_UPDATE: ({ action, amount, user, before, now }) =>
			`You have just ${action === 'add' ? 'added' : 'removed'} ${amount} ${
				amount === 1 ? 'point' : 'points'
			} to the __Member Profile__ for ${user}. Before: ${before}; Now: ${now}.`,

		/**
		 * ##################
		 * STARBOARD COMMANDS
		 */

		COMMAND_STAR_NOSTARS: 'There is no starred message.',
		COMMAND_STAR_STATS: 'Starboard Stats',
		COMMAND_STAR_STATS_DESCRIPTION: ({ messages, stars }) =>
			`${messages} ${messages === 1 ? 'message' : 'messages'} starred with a total of ${stars} ${stars === 1 ? 'star' : 'stars'}.`,
		COMMAND_STAR_TOPSTARRED: 'Top Starred Posts',
		COMMAND_STAR_TOPSTARRED_DESCRIPTION: ({ medal, id, stars }) => `${medal}: ${id} (${stars} ${stars === 1 ? 'star' : 'stars'})`,
		COMMAND_STAR_TOPRECEIVERS: 'Top Star Receivers',
		COMMAND_STAR_TOPRECEIVERS_DESCRIPTION: ({ medal, id, stars }) => `${medal}: <@${id}> (${stars} ${stars === 1 ? 'star' : 'stars'})`,

		/**
		 * ####################
		 * SUGGESTIONS COMMANDS
		 */
		COMMAND_SUGGEST_DESCRIPTION: 'Posts a suggestion for the server.',
		COMMAND_SUGGEST_EXTENDED: {
			extendedHelp: "Posts a suggestion to the server's suggestion channel, if configured.",
			explainedUsage: [['suggestion', 'Your suggestion']],
			examples: ["Let's make a music channel!"],
			reminder:
				'You need to have a suggestions channel setup for this command to work. If you are an administrator, you will be given the chance to do so upon invoking the command.'
		},
		COMMAND_SUGGEST_NOSETUP: ({ username }) => `I'm sorry ${username}, but a suggestions channel hasn't been set up.`,
		COMMAND_SUGGEST_NOSETUP_ASK: ({ username }) =>
			`I'm sorry ${username}, but a suggestions channel hasn't been set up. Would you like to set up a channel now?`,
		COMMAND_SUGGEST_NOSETUP_ABORT: 'Alright then. Aborted creating a new suggestion.',
		COMMAND_SUGGEST_NOPERMISSIONS: ({ username, channel }) =>
			`I'm sorry ${username}, but the administrators didn't give me permission to send messages in ${channel}!`,
		COMMAND_SUGGEST_CHANNEL_PROMPT: 'Please mention the channel you want to set as the suggestions channel.',
		COMMAND_SUGGEST_TITLE: ({ id }) => `Suggestion #${id}`,
		COMMAND_SUGGEST_SUCCESS: ({ channel }) => `Thank you for your suggestion! It has been successfully posted to ${channel}!`,
		COMMAND_RESOLVESUGGESTION_DESCRIPTION: "Set the suggestion's status.",
		COMMAND_RESOLVESUGGESTION_EXTENDED: {
			extendedHelp: "This command allows you to update a suggestion's status, marking it either as accepted, considered or denied.",
			examples: [
				'1 accept Thank you for your suggestion!',
				'1 a Thank you for your suggestion!',
				"1 consider Hmm... we may do this, but it's really low priority",
				"1 c Hmm... we may do this, but it's really low priority",
				'1 deny There is no way this is going to happen.',
				'1 d There is no way this is going to happen.'
			],
			reminder: `Suggestions also can be configured to DM the author regarding the status of their suggestion, with the \`suggestions.on-action.dm\` setting.
			Furthermore, in case you wish to preserve anonymity, you can hide your name using the \`suggestions.on-action\` setting, which can be overridden with the \`--hide-author\` and \`--show-author\` flags`
		},
		COMMAND_RESOLVESUGGESTION_INVALID_ID: `${REDCROSS} That\'s not a valid suggestion ID!`,
		COMMAND_RESOLVESUGGESTION_MESSAGE_NOT_FOUND: `${REDCROSS} I was not able to retrieve the suggestion as its message has been deleted.`,
		COMMAND_RESOLVESUGGESTION_ID_NOT_FOUND: `${REDCROSS} Couldn\'t find a suggestion with that ID`,
		COMMAND_RESOLVESUGGESTION_DEFAULT_COMMENT: 'No comment was provided.',
		COMMAND_RESOLVESUGGESTION_AUTHOR_ADMIN: 'An administrator',
		COMMAND_RESOLVESUGGESTION_AUTHOR_MODERATOR: 'A moderator',
		COMMAND_RESOLVESUGGESTION_ACTIONS: {
			ACCEPT: ({ author }) => `${author} accepted this suggestion:`,
			CONSIDER: ({ author }) => `${author} considered this suggestion:`,
			DENY: ({ author }) => `${author} denied this suggestion:`
		},
		COMMAND_RESOLVESUGGESTION_ACTIONS_DMS: {
			ACCEPT: ({ author, guild }) => `${author} accepted this suggestion in ${guild}:`,
			CONSIDER: ({ author, guild }) => `${author} considered this suggestion in ${guild}:`,
			DENY: ({ author, guild }) => `${author} denied this suggestion in ${guild}:`
		},
		COMMAND_RESOLVESUGGESTION_DM_FAIL: `${REDCROSS} I wasn\'t able to send the author a DM. Are their DMs closed?`,
		COMMAND_RESOLVESUGGESTION_SUCCESS: ({ id, action }) =>
			`${GREENTICK} Successfully ${
				action === 'a' || action === 'accept' ? 'accepted' : action === 'd' || action === 'deny' ? 'denied' : 'considered'
			} suggestion \`${id}\`!`,

		/**
		 * ###############
		 * SYSTEM COMMANDS
		 */

		COMMAND_EVAL_TIMEOUT: ({ seconds }) => `TIMEOUT: Took longer than ${seconds} seconds.`,
		COMMAND_EVAL_ERROR: ({ time, output, type }) => `**Error**:${output}\n**Type**:${type}\n${time}`,

		COMMAND_STATS_TITLES: {
			STATS: 'Statistics',
			UPTIME: 'Uptime',
			SERVER_USAGE: 'Server Usage'
		},
		COMMAND_STATS_FIELDS: ({ stats, uptime, usage }) => ({
			STATS: [
				`• **Users**: ${stats.USERS}`,
				`• **Guilds**: ${stats.GUILDS}`,
				`• **Channels**: ${stats.CHANNELS}`,
				`• **Discord.js**: ${stats.VERSION}`,
				`• **Node.js**: ${stats.NODE_JS}`,
				`• **Klasa**: ${klasaVersion}`
			].join('\n'),
			UPTIME: [
				`• **Host**: ${duration(uptime.HOST, 2)}`,
				`• **Total**: ${duration(uptime.TOTAL, 2)}`,
				`• **Client**: ${duration(uptime.CLIENT, 2)}`
			].join('\n'),
			SERVER_USAGE: [`• **CPU Load**: ${usage.CPU_LOAD.join('% | ')}%`, `• **Heap**: ${usage.RAM_USED} (Total: ${usage.RAM_TOTAL})`].join('\n')
		}),

		/**
		 * #############
		 * TAGS COMMANDS
		 */

		COMMAND_TAG_DESCRIPTION: "Manage this guilds' tags.",
		COMMAND_TAG_EXTENDED: {
			extendedHelp: [
				'Tags, also known as custom commands, can give you a chunk of text stored under a specific name.',
				'For example after adding a tag with `Skyra, tag add rule1 <your first rule>` you can use it with `Skyra, rule1` or `Skyra, tag rule1`',
				"When adding tags you can customize the final look by adding flags to the tag content (these won't show up in the tag itself!):",
				'❯ Add `--embed` to have Skyra send the tag embedded.',
				'The content will be in the description, so you can use all the markdown you wish. for example, adding [masked links](https://skyra.pw).',
				'❯ Add `--color=<a color>` or `--colour=<a colour>` to have Skyra colourize the embed. Does nothing unless also specifying `--embed`.',
				'Colours can be RGB, HSL, HEX or Decimal.'
			].join('\n'),
			explainedUsage: [
				[
					'action',
					`The action to perform: ${this.list(
						[
							'`add` to add new tags',
							'`remove` to delete a tag',
							'`edit` to edit a tag',
							'`source` to get the source of a tag',
							'`list` to list all known tags',
							'`show` to show a tag'
						],
						'or'
					)}.`
				],
				['tag', "The tag's name."],
				['contents', 'Required for the actions `add` and `edit`, specifies the content for the tag.']
			],
			examples: [
				'add rule1 Respect other users. Harassment, hatespeech, etc... will not be tolerated.',
				'add rule1 --embed --color=#1E88E5 Respect other users. Harassment, hatespeech, etc... will not be tolerated.',
				'edit rule1 Just be respectful with the others.',
				'rule1',
				'source rule1',
				'remove rule1',
				'list'
			],
			multiline: true
		},
		COMMAND_TAG_PERMISSIONLEVEL: 'You must be a staff member, moderator, or admin, to be able to manage tags.',
		COMMAND_TAG_NAME_NOTALLOWED: 'A tag name may not have a grave accent nor invisible characters.',
		COMMAND_TAG_NAME_TOOLONG: 'A tag name must be 50 or less characters long.',
		COMMAND_TAG_EXISTS: ({ tag }) => `The tag '${tag}' already exists.`,
		COMMAND_TAG_CONTENT_REQUIRED: 'You must provide a content for this tag.',
		COMMAND_TAG_ADDED: ({ name, content }) =>
			[
				`Successfully added a new tag: **${name}** with a content of:`,
				`**${content.endsWith('...') ? `${content} (truncated for Discord message length, full tag has been saved)` : content}**`
			].join('\n'),
		COMMAND_TAG_REMOVED: ({ name }) => `Successfully removed the tag **${name}**.`,
		COMMAND_TAG_NOTEXISTS: ({ tag }) => `The tag '${tag}' does not exist.`,
		COMMAND_TAG_EDITED: ({ name, content }) =>
			[
				`Successfully edited the tag **${name}** with a content of`,
				`**${content.endsWith('...') ? `${content} (truncated for Discord message length, full tag has been saved)` : content}**`
			].join('\n'),
		COMMAND_TAG_LIST_EMPTY: 'The tag list for this server is empty.',
		COMMAND_TAG_LIST: ({ tags }) => `${tags.length === 1 ? 'There is 1 tag: ' : `There are ${tags.length} tags: `}${tags.join(', ')}`,
		COMMAND_TAG_RESET: 'All tags have been successfully removed from this server.',

		/**
		 * ##############
		 * TOOLS COMMANDS
		 */

		COMMAND_AVATAR_NONE: 'The user does not have an avatar set.',
		COMMAND_COLOR: ({ hex, rgb, hsl }) => [`HEX: **${hex}**`, `RGB: **${rgb}**`, `HSL: **${hsl}**`].join('\n'),
		COMMAND_EMOJI_CUSTOM: ({ emoji, id }) =>
			[
				`→ ${inlineCodeblock('Emoji ::')} **${emoji}**`,
				`→ ${inlineCodeblock('Type  ::')} **Custom**`,
				`→ ${inlineCodeblock('ID    ::')} **${id}**`
			].join('\n'),
		COMMAND_EMOJI_TWEMOJI: ({ emoji, id }) =>
			[
				`→ ${inlineCodeblock('Emoji ::')} \`${emoji}\``,
				`→ ${inlineCodeblock('Type  ::')} **Twemoji**`,
				`→ ${inlineCodeblock('ID    ::')} **${id}**`
			].join('\n'),
		COMMAND_EMOJI_INVALID: `The argument you provided is not a valid emoji.`,
		COMMAND_EMOJI_TOO_LARGE: ({ emoji }) => `'${emoji}' is so heavy the hamsters couldn't keep with its size. Maybe try one that is smaller?`,
		COMMAND_COUNTRY_DESCRIPTION: 'Shows information about a country.',
		COMMAND_COUNTRY_EXTENDED: {
			extendedHelp: 'This command uses https://restcountries.eu to get information on the provided country.',
			explainedUsage: [['country', 'The name of the country.']],
			examples: ['United Kingdom']
		},
		COMMAND_COUNTRY_TITLES: {
			OVERVIEW: 'Overview',
			LANGUAGES: 'Languages',
			OTHER: 'Other'
		},
		COMMAND_COUNTRY_FIELDS: {
			OVERVIEW: {
				OFFICIAL_NAME: 'Official Name',
				CAPITAL: 'Capital',
				POPULATION: 'Population'
			},
			OTHER: {
				DEMONYM: 'Demonym',
				AREA: 'Area',
				CURRENCIES: 'Currencies'
			}
		},
		COMMAND_ESHOP_DESCRIPTION: 'Request information for any American Nintendo Digital Store',
		COMMAND_ESHOP_EXTENDED: {
			extendedHelp: 'This command queries Nintendo of America to show data for the game you request.',
			explainedUsage: [['query', "The name of the game you're looking for."]],
			examples: ['Breath of the Wild', 'Pokemon', 'Splatoon']
		},
		COMMAND_ESHOP_NOT_IN_DATABASE: 'None available',
		COMMAND_ESHOP_TITLES: {
			PRICE: 'Price',
			AVAILABILITY: 'Availability',
			RELEASE_DATE: 'Release Date',
			NUMBER_OF_PLAYERS: 'Number of Players',
			PLATFORM: 'Platform',
			CATEGORIES: 'Categories',
			NO_CATEGORIES: 'This game has not been sorted into any categories',
			NSUID: 'NSUID',
			ESRB: 'ESRB'
		},
		COMMAND_ESHOP_PRICE: ({ price }) => (price > 0 ? `$${price} USD` : 'Free'),
		COMMAND_HOROSCOPE_DESCRIPTION: 'Get your latest horoscope',
		COMMAND_HOROSCOPE_EXTENDED: {
			extendedHelp: "Gets the horoscope for a given sun sign from Kelli Fox's The Astrologer.",
			explainedUsage: [
				['sunsign', 'The sun sign you want to get the horoscope for'],
				[
					'today|tomorrow|yesterday',
					'(Optional, defaults to "today") If you want to get the horoscope of yesterday or tomorrow you can specify that.'
				]
			],
			examples: ['pisces', 'virgo tomorrow', 'gemini yesterday', 'aries today']
		},
		COMMAND_HOROSCOPE_INVALID_SUNSIGN: ({ sign, maybe }) => `${sign} is an invalid sun sign, maybe try ${maybe}`,
		COMMAND_HOROSCOPE_TITLES: {
			DAILY_HOROSCOPE: ({ sign }) => `Daily horoscope for ${sign}`,
			METADATA_TITLE: 'Metadata',
			METADATA: ({ intensity, keywords, mood, rating }) =>
				[`**Intensity:** ${intensity}`, `**Keywords:** ${this.list(keywords, 'and')}`, `**Mood:** ${mood}`, `**Rating:** ${rating}`].join(
					'\n'
				)
		},
		COMMAND_IGDB_DESCRIPTION: 'Searches IGDB (Internet Game Database) for your favourite games',
		COMMAND_IGDB_EXTENDED: {
			extendedHelp: 'This command queries the IGDB API to show data on your favourite games.',
			explainedUsage: [['query', 'The name of the game']],
			examples: ['Breath of the Wild', 'Borderlands 3']
		},
		COMMAND_IGDB_TITLES: {
			USER_SCORE: 'User score',
			AGE_RATING: 'Age rating(s)',
			RELEASE_DATE: 'Release date',
			GENRES: 'Genre(s)',
			DEVELOPERS: 'Developer(s)',
			PLATFORMS: 'Platform(s)'
		},
		COMMAND_IGDB_DATA: {
			NO_DEVELOPERS: 'Developer(s) unknown',
			NO_PLATFORMS: 'Platform(s) unknown',
			NO_RELEASE_DATE: 'Release date unknown',
			NO_RATING: 'No user rating',
			NO_SUMMARY: 'No game summary available',
			NO_GENRES: 'No known genres',
			NO_AGE_RATINGS: 'No age ratings available'
		},
		COMMAND_ITUNES_DESCRIPTION: 'Searches iTunes API for music tracks',
		COMMAND_ITUNES_EXTENDED: {
			extendedHelp: 'This command queries the Apple iTunes API to show data on a music you request.',
			explainedUsage: [['query', 'The name of the song']],
			examples: ['Apocalyptica feat. Brent Smith', "You're Gonna Go Far, Kid"]
		},
		COMMAND_ITUNES_TITLES: {
			ARTIST: 'Artist',
			COLLECTION: 'Collection',
			COLLECTION_PRICE: 'Collection price (USD)',
			TRACK_PRICE: 'Track price (USD)',
			TRACK_RELEASE_DATE: 'Track Release Date',
			NUMBER_OF_TRACKS_IN_COLLECTION: '# Tracks in collection',
			PRIMARY_GENRE: 'Primary genre',
			PREVIEW: 'Preview',
			PREVIEW_LABEL: 'Click here'
		},
		COMMAND_LMGTFY_CLICK: 'Click me to search',
		COMMAND_MOVIES_DESCRIPTION: 'Searches TheMovieDatabase for any movie',
		COMMAND_MOVIES_EXTENDED: {
			extendedHelp: [
				'This command queries TheMovieDatabase API for data on your favourite movies',
				"Tip: You can use the 'y:' filter to narrow your results by year. Example: 'star wars y:1977'."
			],
			explainedUsage: [['query', 'The name of the movie']],
			examples: ["Ocean's Eleven y:2001", 'Star Wars Revenge of the Sith', 'Spirited Away']
		},
		COMMAND_MOVIES_TITLES: {
			RUNTIME: 'Runtime',
			USER_SCORE: 'User score',
			STATUS: 'Status',
			RELEASE_DATE: 'Release date',
			IMDB_PAGE: 'IMDB Page',
			HOME_PAGE: 'Home Page',
			COLLECTION: 'Collection',
			GENRES: 'Genres'
		},
		COMMAND_MOVIES_DATA: {
			VARIABLE_RUNTIME: 'Variable',
			MOVIE_IN_PRODUCTION: 'Movie in production',
			LINK_CLICK_HERE: 'Click here',
			NONE: 'None',
			NOT_PART_OF_COLLECTION: 'Not part of a collection',
			NO_GENRES: 'None on TheMovieDB'
		},
		COMMAND_SHOWS_DESCRIPTION: 'Searches The Movie Database for any show',
		COMMAND_SHOWS_EXTENDED: {
			extendedHelp: 'This command queries TheMovieDatabase for data on your favorite shows',
			explainedUsage: [['query', 'The name of the show']],
			examples: ['Final Space', 'Gravity Falls', 'Rick and Morty']
		},
		COMMAND_SHOWS_TITLES: {
			EPISODE_RUNTIME: 'Episode runtime',
			USER_SCORE: 'User score',
			STATUS: 'Status',
			FIRST_AIR_DATE: 'First air date',
			GENRES: 'Genres'
		},
		COMMAND_SHOWS_DATA: {
			VARIABLE_RUNTIME: 'Variable',
			UNKNOWN_USER_SCORE: 'No user score',
			NO_GENRES: 'None on TheMovieDB'
		},
		COMMAND_PRICE_CURRENCY: ({ fromCurrency, fromAmount, worths }) =>
			`**${fromAmount}** ${fromCurrency.toUpperCase()} is worth ${this.list(worths, 'and')}.`,
		COMMAND_PRICE_CURRENCY_NOT_FOUND: 'There was an error, please make sure you specified an appropriate coin and currency.',
		COMMAND_QUOTE_MESSAGE: 'It is very weird, but said message does not have a content nor a image.',
		COMMAND_ROLES_LIST_EMPTY: 'This server does not have a role listed as a public role.',
		COMMAND_ROLES_ABORT: ({ prefix }) =>
			`I looked far and wide, but I seem to not have found what you were looking for. Please run \`${prefix}roles\` for the full list!`,
		COMMAND_ROLES_LIST_TITLE: 'List of public roles',
		COMMAND_ROLES_ADDED: ({ roles }) => `The following roles have been added to your profile: \`${roles}\``,
		COMMAND_ROLES_REMOVED: ({ roles }) => `The following roles have been removed from your profile: \`${roles}\``,
		COMMAND_ROLES_NOT_PUBLIC: ({ roles }) => `The following roles are not public: \`${roles}\``,
		COMMAND_ROLES_NOT_MANAGEABLE: ({ roles }) => `The following roles cannot be given by me due to their hierarchy role position: \`${roles}\``,
		COMMAND_ROLES_AUDITLOG: "Authorized: Public Role Management | 'Roles' Command.",
		COMMAND_DUCKDUCKGO_NOTFOUND: 'I am sorry, but DuckDuckGo API returned a blank response. Try again with different keywords.',
		COMMAND_DUCKDUCKGO_LOOKALSO: 'Related to this topic:',

		COMMAND_URBAN_NOTFOUND: 'I am sorry, the word you are looking for does not seem to be defined in UrbanDictionary. Try another word?',
		COMMAND_URBAN_INDEX_NOTFOUND: 'You may want to try a lower page number.',
		SYSTEM_TEXT_TRUNCATED: ({ definition, url }) => `${definition}... [continue reading](${url})`,
		COMMAND_WHOIS_MEMBER_TITLES: {
			JOINED: 'Joined',
			CREATED_AT: 'Created At'
		},
		COMMAND_WHOIS_MEMBER_FIELDS: ({ member }) => ({
			JOINED: member.joinedTimestamp
				? `${timestamp.displayUTC(member.joinedTimestamp)}\n${duration(Date.now() - member.joinedTimestamp, 2)} ago`
				: 'Unknown',
			CREATED_AT: `${timestamp.displayUTC(member.user.createdAt)}\n${duration(Date.now() - member.user.createdTimestamp, 2)} ago`,
			FOOTER: `ID: ${member.id}`
		}),
		COMMAND_WHOIS_MEMBER_ROLES: ({ amount }) => (amount === 1 ? 'Role [1]' : `Roles [${amount}]`),
		COMMAND_WHOIS_MEMBER_PERMISSIONS: 'Key Permissions',
		COMMAND_WHOIS_MEMBER_PERMISSIONS_ALL: 'All Permissions',
		COMMAND_WHOIS_USER_TITLES: {
			CREATED_AT: 'Created At'
		},
		COMMAND_WHOIS_USER_FIELDS: ({ user }) => ({
			CREATED_AT: `${timestamp.displayUTC(user.createdAt)}\n${duration(Date.now() - user.createdTimestamp, 2)} ago`,
			FOOTER: `ID: ${user.id}`
		}),
		COMMAND_FOLLOWAGE: ({ user, channel, time }) => `${user} has been following ${channel} for ${duration(time, 2)}.`,
		COMMAND_FOLLOWAGE_MISSING_ENTRIES: 'Either the user or the channel do not exist. Make sure you wrote their names correctly.',
		COMMAND_FOLLOWAGE_NOT_FOLLOWING: 'That user is not following the specified channel.',
		COMMAND_TWITCH_NO_ENTRIES: 'There are no entries. Are you sure you wrote the user name correctly?',
		COMMAND_TWITCH_TITLES: {
			FOLLOWERS: 'Followers',
			VIEWS: 'Views',
			CLICK_TO_VISIT: "Click to go to streamer's channel",
			PARTNER: 'Partner'
		},
		COMMAND_TWITCH_MATURITY: ({ mature }) => (mature ? 'This is a mature channel.' : 'This channel is safe for everyone.'),
		COMMAND_TWITCH_PARTNERSHIP: ({ affiliateStatus }) =>
			affiliateStatus === false ? 'This channel is not part of the Twitch affiliate program.' : affiliateStatus,
		COMMAND_TWITCH_AFFILIATE_STATUS: {
			AFFILIATED: 'This is an affiliated channel.',
			PARTNERED: 'This is a partnered channel.'
		},
		COMMAND_TWITCH_CREATED_AT: 'Created At:',
		COMMAND_TWITCHSUBSCRIPTION_REQUIRED_STREAMER: `${REDCROSS} You must specify which streamer you want to subscribe to.`,
		COMMAND_TWITCHSUBSCRIPTION_STREAMER_NOT_FOUND: `${REDCROSS} Sorry, I could not find the streamer. Are you sure you wrote their name correctly?`,
		COMMAND_TWITCHSUBSCRIPTION_REQUIRED_CHANNEL: `${REDCROSS} You must tell me where do you want the messages to be sent.`,
		COMMAND_TWITCHSUBSCRIPTION_REQUIRED_STATUS: `${REDCROSS} You must tell me which type of notification do you want, the options are "online" and "offline".`,
		COMMAND_TWITCHSUBSCRIPTION_STATUS_VALUES: ['online', 'offline'],
		COMMAND_TWITCHSUBSCRIPTION_INVALID_STATUS: `${REDCROSS} Woah there! I expected "online" or "offline", but I cannot understand what you gave me instead.`,
		COMMAND_TWITCHSUBSCRIPTION_REQUIRED_CONTENT: `${REDCROSS} Mhmm, I wonder what you want me to send when the user goes live or something. Can you give me a hint please?`,
		COMMAND_TWITCHSUBSCRIPTION_ADD_DUPLICATED: `${REDCROSS} You're already subscribed to that streamer in this channel for that status.`,
		COMMAND_TWITCHSUBSCRIPTION_ADD_SUCCESS: ({ name, channel, status }) =>
			`${GREENTICK} Success! Whenever ${name} goes ${
				status === NotificationsStreamsTwitchEventStatus.Offline ? 'offline' : 'live'
			}, I will post a new message in ${channel}.`,
		COMMAND_TWITCHSUBSCRIPTION_REMOVE_STREAMER_NOT_SUBSCRIBED: `${REDCROSS} I'm sorry, you cannot unsubscribe from a channel you're not subscribed to. Please subscribe to be able to unsubscribe.`,
		COMMAND_TWITCHSUBSCRIPTION_REMOVE_ENTRY_NOT_EXISTS: `${REDCROSS} I'm sorry; while you're subscribed to this user, their subscriptions are not posted in that channel.`,
		COMMAND_TWITCHSUBSCRIPTION_REMOVE_SUCCESS: ({ name, channel, status }) =>
			`${GREENTICK} Success! I will not longer post messages to ${channel} whenever ${name} goes ${
				status === NotificationsStreamsTwitchEventStatus.Offline ? 'offline' : 'live'
			}.`,
		COMMAND_TWITCHSUBSCRIPTION_RESET_EMPTY: `${REDCROSS} You were not subscribed to any streamer, mission abort!`,
		COMMAND_TWITCHSUBSCRIPTION_RESET_SUCCESS: ({ entries }) =>
			`${GREENTICK} Success! ${entries} subscription${entries === 1 ? ' has' : 's have'} been removed from this server.`,
		COMMAND_TWITCHSUBSCRIPTION_RESET_STREAMER_NOT_SUBSCRIBED: `${REDCROSS} You were not subscribed to this streamer. Are you sure you specified the right one?`,
		COMMAND_TWITCHSUBSCRIPTION_RESET_CHANNEL_SUCCESS: ({ name, entries }) =>
			`${GREENTICK} Success! Removed ${entries} subscription${entries === 1 ? '' : 's'} from the streamer ${name}.`,
		COMMAND_TWITCHSUBSCRIPTION_SHOW_STREAMER_NOT_SUBSCRIBED: `${REDCROSS} You wanted to see all subscriptions from this streamer, but there are none!`,
		COMMAND_TWITCHSUBSCRIPTION_SHOW_STATUS: ['Online', 'Offline'],
		COMMAND_TWITCHSUBSCRIPTION_SHOW_EMPTY: `${REDCROSS} There are no subscriptions, who will be the first?`,
		COMMAND_TWITCHSUBSCRIPTION_SHOW_UNKNOWN_USER: 'Unknown',
		COMMAND_WIKIPEDIA_NOTFOUND: 'I am sorry, I could not find something that could match your input in Wikipedia.',
		COMMAND_YOUTUBE_NOTFOUND: 'I am sorry, I could not find something that could match your input in YouTube.',
		COMMAND_YOUTUBE_INDEX_NOTFOUND: 'You may want to try a lower page number, because I am unable to find something at this index.',
		COMMAND_DEFINE_DESCRIPTION: 'Check the definition of a word.',
		COMMAND_DEFINE_EXTENDED: {
			extendedHelp: `What does "heel" mean?`,
			explainedUsage: [['Word', 'The word or phrase you want to get the definition from.']],
			examples: ['heel']
		},
		COMMAND_DEFINE_NOTFOUND: 'I could not find a definition for this word.',
		COMMAND_DEFINE_PRONOUNCIATION: 'Pronunciation',
		COMMAND_DEFINE_UNKNOWN: 'Unknown',

		/**
		 * #############
		 * WEEB COMMANDS
		 */

		COMMAND_WBANG: ({ user }) => `Hey ${user}... bang!`,
		COMMAND_WBANGHEAD: 'Head bang in progress!',
		COMMAND_WBITE: ({ user }) => `Biting ${user}!`,
		COMMAND_WBLUSH: 'You made them blush! 😊',
		COMMAND_WCRY: ({ user }) => `Dear ${user}, did you make them cry? 💔`,
		COMMAND_WCUDDLE: ({ user }) => `Here is a cuddle for you, ${user} 💞`,
		COMMAND_WDANCE: 'Dancing! 💃',
		COMMAND_WGREET: ({ user }) => `Hello there ${user}!`,
		COMMAND_WHUG: ({ user }) => `Here is a nice hug for you, ${user} ❤`,
		COMMAND_WKISS: ({ user }) => `Here is a kiss for you, ${user} 💜`,
		COMMAND_WLEWD: 'Too lewd for my tastes!',
		COMMAND_WLICK: ({ user }) => `Licking ${user} 👅`,
		COMMAND_WNOM: 'Nom, nom, nom! 😊',
		COMMAND_WNEKO: 'Nya! 🐱',
		COMMAND_WPAT: ({ user }) => `Gently pats ${user}'s head ❤`,
		COMMAND_WPOUT: 'Uh?',
		COMMAND_WPUNCH: ({ user }) => `Punching ${user}!`,
		COMMAND_WSLAP: ({ user }) => `Slapping ${user}!`,
		COMMAND_WSLEEPY: 'Falling asleep...',
		COMMAND_WSMILE: 'Showing a radiant smile!',
		COMMAND_WSMUG: "There's a smug face!",
		COMMAND_WSTARE: ({ user }) => `Dear ${user}, somebody is staring at you 👀`,
		COMMAND_WTHUMBSUP: 'You have their thumbs up!',
		COMMAND_WTICKLE: ({ user }) => `Tickles for you, ${user}!`,

		/**
		 * #################################
		 * #            MONITORS           #
		 * #################################
		 */

		CONST_MONITOR_INVITELINK: 'Invite link',
		CONST_MONITOR_LINK: 'Filtered Link',
		CONST_MONITOR_NMS: '[NOMENTIONSPAM]',
		CONST_MONITOR_WORDFILTER: 'Filtered Word',
		CONST_MONITOR_CAPSFILTER: 'Too Many UpperCases',
		CONST_MONITOR_ATTACHMENTFILTER: 'Too Many Attachments',
		CONST_MONITOR_MESSAGEFILTER: 'Too Many Message Duplicates',
		CONST_MONITOR_NEWLINEFILTER: 'Too Many Lines',
		CONST_MONITOR_REACTIONFILTER: 'Filtered Reaction',
		MODERATION_MONITOR_ATTACHMENTS: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered attachment filter, no threshold.'
				: `[Auto-Moderation] Triggered attachment filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_CAPITALS: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered capital filter, no threshold.'
				: `[Auto-Moderation] Triggered capital filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_INVITES: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered invite filter, no threshold.'
				: `[Auto-Moderation] Triggered invite filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_LINKS: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered link filter, no threshold.'
				: `[Auto-Moderation] Triggered link filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_MESSAGES: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered duplicated message filter, no threshold.'
				: `[Auto-Moderation] Triggered duplicated message filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_NEWLINES: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered newline filter, no threshold.'
				: `[Auto-Moderation] Triggered newline filter, reached ${amount} out of ${maximum} infractions.`,
		MODERATION_MONITOR_WORDS: ({ amount, maximum }) =>
			maximum === 0
				? '[Auto-Moderation] Triggered word filter, no threshold.'
				: `[Auto-Moderation] Triggered word filter, reached ${amount} out of ${maximum} infractions.`,
		MONITOR_INVITE_FILTER_ALERT: ({ user }) => `${REDCROSS} Dear ${user}, invite links aren't allowed here.`,
		MONITOR_INVITE_FILTER_LOG: ({ links }) => `**Link${links.length === 1 ? '' : 's'}**: ${this.list(links, 'and')}`,
		MONITOR_NOLINK: ({ user }) => `${REDCROSS} Hey ${user}, you are not allowed to post links here!`,
		MONITOR_WORDFILTER_DM: ({ filtered }) =>
			`Shush! You said some words that are not allowed in the server! But since you took a moment to write the message, I will post it here:\n${filtered}`,
		MONITOR_CAPSFILTER_DM: ({ message }) => `Speak lower! I know you need to express your thoughts. There is the message I deleted:${message}`,
		MONITOR_WORDFILTER: ({ user }) => `${REDCROSS} Pardon, dear ${user}, you said something that is not allowed in this server.`,
		MONITOR_CAPSFILTER: ({ user }) => `${REDCROSS} EEEOOO ${user}! PLEASE DO NOT SHOUT IN THIS PLACE! YOU HAVE HIT THE CAPS LIMIT!`,
		MONITOR_MESSAGEFILTER: ({ user }) => `${REDCROSS} Woah woah woah, please stop re-posting so much ${user}!`,
		MONITOR_NEWLINEFILTER: ({ user }) => `${REDCROSS} Wall of text incoming from ${user}, wall of text taken down!`,
		MONITOR_REACTIONSFILTER: ({ user }) => `${REDCROSS} Hey ${user}, please do not add that reaction!`,
		MONITOR_NMS_MESSAGE: ({ user }) =>
			[
				`The banhammer has landed and now the user ${user.tag} with id ${user.id} is banned for mention spam.`,
				"Do not worry! I'm here to help you! 😄"
			].join('\n'),
		MONITOR_NMS_MODLOG: ({ threshold }) => `[NOMENTIONSPAM] Automatic: Mention Spam threshold exceeded.\nThreshold: ${threshold}.`,
		MONITOR_NMS_ALERT: "Be careful mentioning any more, as you are about to be banned for exceeding this server's mention threshold.",
		MONITOR_SOCIAL_ACHIEVEMENT: 'Congratulations dear %MEMBER%, you achieved the role %ROLE%',

		/**
		 * #################################
		 * #           INHIBITORS          #
		 * #################################
		 */

		INHIBITOR_SPAM: ({ channel }) =>
			`Can we move to ${channel} please? This command might be too spammy and can ruin other people's conversations.`,

		/**
		 * #################################
		 * #              GAMES            #
		 * #################################
		 */

		HG_BLOODBATH: [
			'{1} grabs a shovel.',
			'{1} grabs a backpack and retreats.',
			'{1} and {2} fight for a bag. {1} gives up and retreats.',
			'{1} and {2} fight for a bag. {2} gives up and retreats.',
			'{1} finds a bow, some arrows, and a quiver.',
			'{1} runs into the cornucopia and hides.',
			'{1} takes a handful of throwing knives.',
			"{1} rips a mace out of {2}'s hands.",
			'{1} finds a canteen full of water.',
			'{1} stays at the cornucopia for resources.',
			'{1} gathers as much food as they can.',
			'{1} grabs a sword.',
			'{1} takes a spear from inside the cornucopia.',
			'{1} finds a bag full of explosives.',
			'{1} clutches a first aid kit and runs away.',
			'{1} takes a sickle from inside the cornucopia.',
			'{1}, {2}, and {3} work together to get as many supplies as possible.',
			'{1} runs away with a lighter and some rope.',
			'{1} snatches a bottle of alcohol and a rag.',
			'{1} finds a backpack full of camping equipment.',
			'{1} grabs a backpack, not realizing it is empty.',
			"{1} breaks {2}'s nose for a basket of bread.",
			'{1}, {2}, {3}, and {4} share everything they gathered before running.',
			'{1} retrieves a trident from inside the cornucopia.',
			'{1} grabs a jar of fishing bait while {2} gets fishing gear.',
			'{1} scares {2} away from the cornucopia.',
			'{1} grabs a shield leaning on the cornucopia.',
			'{1} snatches a pair of sais.',
			'{1} grabs a lone pair of pants.',
			'{1T} steps off their podium too soon and blows up.',
			"{1} throws a knife into {2T}'s head.",
			'{1T} accidently steps on a landmine.',
			'{1} catches {2T} off guard and kills them.',
			'{1} and {2} work together to drown {3T}.',
			'{1} strangles {2T} after engaging in a fist fight.',
			"{1} shoots an arrow into {2T}'s head.",
			'{1T} cannot handle the circumstances and commits suicide.',
			"{1} bashes {2T}'s head against a rock several times.",
			"{1} snaps {2T}'s neck.",
			'{1} decapitates {2T} with a sword.',
			'{1} spears {2T} in the abdomen.',
			'{1} sets {2T} on fire with a molotov.',
			'{1T} falls into a pit and dies.',
			'{1} stabs {2T} while their back is turned.',
			'{1} severely injures {2T}, but puts them out of their misery.',
			'{1} severely injures {2T} and leaves them to die.',
			"{1} bashes {2T}'s head in with a mace.",
			'{1} pushes {2T} off a cliff during a knife fight.',
			"{1} throws a knife into {2T}'s chest.",
			'{1T} is unable to convince {2} to not kill them.',
			'{1} convinces {2T} to not kill them, only to kill {2T} instead.',
			'{1T} falls into a frozen lake and drowns.',
			'{1}, {2}, and {3T} start fighting, but {2} runs away as {1} kills {3T}.',
			'{1} kills {2T} with their own weapon.',
			'{1} overpowers {2T}, killing them.',
			'{1} sets an explosive off, killing {2T}.',
			'{1} sets an explosive off, killing {2T}, and {3T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, and {4T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, {4T} and {5T}.',
			'{1} kills {2T} as they try to run.',
			'{1T} and {2T} threaten a double suicide. It fails and they die.',
			'{1T}, {2T}, {3T}, and {4T} form a suicide pact, killing themselves.',
			'{1} kills {2T} with a hatchet.',
			'{1} and {2} fight {3T} and {4T}. {1} and {2} survive.',
			'{1T} and {2T} fight {3} and {4}. {3} and {4} survive.',
			'{1T} attacks {2}, but {3} protects them, killing {1T}.',
			'{1} severely slices {2T} with a sword.',
			'{1} strangles {2T} with a rope.',
			'{1} kills {2T} for their supplies.',
			'{1} shoots an arrow at {2}, but misses and kills {3T} instead.',
			"{1} shoots a poisonous blow dart into {2T}'s neck, slowly killing them.",
			'{1} stabs {2T} with a tree branch.',
			'{1} stabs {2T} in the back with a trident.',
			'{1}, {2T}, and {3T} get into a fight. {1} triumphantly kills them both.',
			'{1T}, {2}, and {3T} get into a fight. {2} triumphantly kills them both.',
			'{1T}, {2T}, and {3} get into a fight. {3} triumphantly kills them both.',
			'{1} finds {2T} hiding in the cornucopia and kills them.',
			'{1T} finds {2} hiding in the cornucopia, but {2} kills them.',
			'{1} kills {2T} with a sickle.',
			'{1} and {2T} fight for a bag. {1} strangles {2T} with the straps and runs.',
			'{1T} and {2} fight for a bag. {2} strangles {1T} with the straps and runs.',
			'{1} repeatedly stabs {2T} to death with sais.',
			'{1T} trips over while running from the cornucopia, and is killed by {2}.',
			'{1} trips over while running from the cornucopia, {2} picks them up, they run off together.',
			"{1} aims an arrow at {2}'s head and shoots, {3T} jumps in the way and sacrifies their life to save them."
		].map(HungerGamesUsage.create),
		HG_DAY: [
			'{1} goes hunting.',
			'{1} injures themself.',
			'{1} explores the arena.',
			'{1} scares {2} off.',
			"{1} diverts {2}'s attention and runs away.",
			'{1} stalks {2}.',
			'{1} fishes.',
			'{1} camouflauges themself in the bushes.',
			"{1} steals from {2} while they aren't looking.",
			'{1} makes a wooden spear.',
			'{1} discovers a cave.',
			'{1} attacks {2}, but they manage to escape.',
			'{1} chases {2}.',
			'{1} runs away from {2}.',
			'{1} collects fruit from a tree.',
			'{1} receives a hatchet from an unknown sponsor.',
			'{1} receives clean water from an unknown sponsor.',
			'{1} receives medical supplies from an unknown sponsor.',
			'{1} receives fresh food from an unknown sponsor.',
			'{1} searches for a water source.',
			'{1} defeats {2} in a fight, but spares their life.',
			'{1} and {2} work together for the day.',
			'{1} begs for {2} to kill them. They refuse, keeping {1} alive.',
			'{1} tries to sleep through the entire day.',
			"{1}, {2}, {3}, and {4} raid {5}'s camp while they are hunting.",
			'{1} constructs a shack.',
			'{1} overhears {2} and {3} talking in the distance.',
			'{1} practices their archery.',
			'{1} thinks about home.',
			'{1} is pricked by thorns while picking berries.',
			'{1} tries to spear fish with a trident.',
			'{1} searches for firewood.',
			'{1} and {2} split up to search for resources.',
			'{1} picks flowers.',
			"{1} tends to {2}'s wounds.",
			'{1} sees smoke rising in the distance, but decides not to investigate.',
			'{1} sprains their ankle while running away from {2}.',
			'{1} makes a slingshot.',
			'{1} travels to higher ground.',
			'{1} discovers a river.',
			'{1} hunts for other tributes.',
			'{1} and {2} hunt for other tributes.',
			'{1}, {2}, and {3} hunt for other tributes.',
			'{1}, {2}, {3}, and {4} hunt for other tributes.',
			'{1}, {2}, {3}, {4}, and {5} hunt for other tributes.',
			'{1} receives an explosive from an unknown sponsor.',
			'{1} questions their sanity.',
			'{1} forces {2} to eat pant.',
			'{1} forces {2T} to eat pant. {2T} chokes and dies.',
			'{1} catches {2T} off guard and kills them.',
			"{1} throws a knife into {2T}'s head.",
			'{1T} begs for {2} to kill them. They reluctantly oblige, killing {1T}.',
			'{1} and {2} work together to drown {3T}.',
			'{1} strangles {2T} after engaging in a fist fight.',
			"{1} shoots an arrow into {2T}'s head.",
			'{1T} bleeds out due to untreated injuries.',
			'{1T} cannot handle the circumstances and commits suicide.',
			"{1} bashes {2T}'s head against a rock several times.",
			'{1T} unknowingly eats toxic berries.',
			"{1} silently snaps {2T}'s neck.",
			"{1} taints {2T}'s food, killing them.",
			'{1} decapitates {2T} with a sword.',
			'{1T} dies from an infection.',
			'{1} spears {2T} in the abdomen.',
			'{1} sets {2T} on fire with a molotov.',
			'{1T} falls into a pit and dies.',
			'{1} stabs {2T} while their back is turned.',
			'{1} severely injures {2T}, but puts them out of their misery.',
			'{1} severely injures {2T} and leaves them to die.',
			"{1} bashes {2T}'s head in with a mace.",
			'{1T} attempts to climb a tree, but falls to their death.',
			'{1} pushes {2T} off a cliff during a knife fight.',
			"{1} throws a knife into {2T}'s chest.",
			"{1}'s trap kills {2T}.",
			'{1} kills {2T} while they are resting.',
			'{1T} is unable to convince {2} to not kill them.',
			'{1} convinces {2T} to not kill them, only to kill {2T} instead.',
			'{1T} falls into a frozen lake and drowns.',
			'{1}, {2}, and {3T} start fighting, but {2} runs away as {1} kills {3T}.',
			'{1} kills {2T} with their own weapon.',
			'{1} overpowers {2T}, killing them.',
			'{1} sets an explosive off, killing {2T}.',
			'{1} sets an explosive off, killing {2T}, and {3T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, and {4T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, {4T} and {5T}.',
			'{1} kills {2T} as they try to run.',
			'{1T} and {2T} threaten a double suicide. It fails and they die.',
			'{1T}, {2T}, {3T}, and {4T} form a suicide pact, killing themselves.',
			'{1T} dies from hypothermia.',
			'{1T} dies from hunger.',
			'{1T} dies from thirst.',
			'{1} kills {2T} with a hatchet.',
			'{1} and {2} fight {3T} and {4T}. {1} and {2} survive.',
			'{1T} and {2T} fight {3} and {4}. {3} and {4} survive.',
			'{1T} dies trying to escape the arena.',
			'{1T} dies of dysentery.',
			'{1T} accidently detonates a land mine while trying to arm it.',
			'{1T} attacks {2}, but {3} protects them, killing {1T}.',
			'{1} ambushes {2T} and kills them.',
			'{1T} accidently steps on a landmine.',
			'{1} severely slices {2T} with a sword.',
			'{1} strangles {2T} with a rope.',
			'{1} kills {2T} for their supplies.',
			'{1} shoots an arrow at {2}, but misses and kills {3T} instead.',
			"{1} shoots a poisonous blow dart into {2T}'s neck, slowly killing them.",
			'{1}, {2}, and {3} successfully ambush and kill {4T}, {5T}, and {6T}.',
			'{1T}, {2T}, and {3T} unsuccessfully ambush {4}, {5}, and {6}, who kill them instead.',
			'{1} stabs {2T} with a tree branch.',
			'{1} forces {2} to kill {3T} or {4}. They decide to kill {3T}.',
			'{1} forces {2} to kill {3} or {4T}. They decide to kill {4T}.',
			'{1} forces {2T} to kill {3} or {4}. They refuse to kill, so {1} kills them instead.',
			"{1T} poisons {2}'s drink, but mistakes it for their own and dies.",
			"{1} poisons {2T}'s drink. They drink it and die.",
			'{1} stabs {2T} in the back with a trident.',
			'{1T} attempts to climb a tree, but falls on {2T}, killing them both.',
			'{1}, {2T}, and {3T} get into a fight. {1} triumphantly kills them both.',
			'{1T}, {2}, and {3T} get into a fight. {2} triumphantly kills them both.',
			'{1T}, {2T}, and {3} get into a fight. {3} triumphantly kills them both.',
			'{1} kills {2T} with a sickle.',
			'{1}, {2}, {3}, {4}, and {5} track down and kill {6T}.',
			'{1}, {2}, {3}, and {4} track down and kill {5T}.',
			'{1}, {2}, and {3} track down and kill {4T}.',
			'{1} and {2} track down and kill {3T}.',
			'{1} tracks down and kills {2T}.',
			'{1} repeatedly stabs {2T} to death with sais.',
			'{1} doodles in the dirt.',
			'{1} chases a butterfly.',
			'{1T} falls off a cliff, and is impaled by a stick.',
			'{1} runs into {2}, they decide to team up.',
			'{1} sees {2} through the trees, and plans on killing them.',
			'{1} sneaks up behind {2T}, and snaps their neck.',
			'{1T} challenges {2} to a fight, and promptly dies.',
			'{1} murders their partner, {2T}, to have more supplies for themself.'
		].map(HungerGamesUsage.create),
		HG_NIGHT: [
			'{1} starts a fire.',
			'{1} sets up camp for the night.',
			'{1} loses sight of where they are.',
			'{1} climbs a tree to rest.',
			'{1} goes to sleep.',
			'{1} and {2} tell stories about themselves to each other.',
			'{1}, {2}, {3}, and {4} sleep in shifts.',
			'{1}, {2}, and {3} sleep in shifts.',
			'{1} and {2} sleep in shifts.',
			'{1} tends to their wounds.',
			'{1} sees a fire, but stays hidden.',
			'{1} screams for help.',
			'{1} stays awake all night.',
			'{1} passes out from exhaustion.',
			'{1} cooks their food before putting their fire out.',
			'{1} and {2} run into each other and decide to truce for the night.',
			'{1} fends {2}, {3}, and {4} away from their fire.',
			'{1}, {2}, and {3} discuss the games and what might happen in the morning.',
			'{1} cries themself to sleep.',
			'{1} tries to treat their infection.',
			'{1} and {2} talk about the tributes still alive.',
			'{1} is awoken by nightmares.',
			'{1} and {2} huddle for warmth.',
			'{1} thinks about winning.',
			'{1}, {2}, {3}, and {4} tell each other ghost stories to lighten the mood.',
			'{1} looks at the night sky.',
			'{1} defeats {2} in a fight, but spares their life.',
			'{1} begs for {2} to kill them. They refuse, keeping {1} alive.',
			"{1} destroys {2}'s supplies while they are asleep.",
			'{1}, {2}, {3}, {4}, and {5} sleep in shifts.',
			'{1} lets {2} into their shelter.',
			'{1} receives a hatchet from an unknown sponsor.',
			'{1} receives clean water from an unknown sponsor.',
			'{1} receives medical supplies from an unknown sponsor.',
			'{1} receives fresh food from an unknown sponsor.',
			'{1} tries to sing themself to sleep.',
			'{1} attempts to start a fire, but is unsuccessful.',
			'{1} thinks about home.',
			"{1} tends to {2}'s wounds.",
			'{1} quietly hums.',
			'{1}, {2}, and {3} cheerfully sing songs together.',
			'{1} is unable to start a fire and sleeps without warmth.',
			'{1} and {2} hold hands.',
			'{1} convinces {2} to snuggle with them.',
			'{1} receives an explosive from an unknown sponsor.',
			'{1} questions their sanity.',
			'{1} forces {2} to eat pant.',
			'{1} forces {2T} to eat pant. {2T} chokes and dies.',
			'{1} catches {2T} off guard and kills them.',
			"{1} throws a knife into {2T}'s head.",
			'{1T} begs for {2} to kill them. They reluctantly oblige, killing {1T}.',
			'{1} and {2} work together to drown {3T}.',
			'{1} strangles {2T} after engaging in a fist fight.',
			"{1} shoots an arrow into {2T}'s head.",
			'{1T} bleeds out due to untreated injuries.',
			'{1T} cannot handle the circumstances and commits suicide.',
			"{1} bashes {2T}'s head against a rock several times.",
			'{1T} unknowingly eats toxic berries.',
			"{1} silently snaps {2T}'s neck.",
			"{1} taints {2T}'s food, killing them.",
			'{1} decapitates {2T} with a sword.',
			'{1T} dies from an infection.',
			'{1} spears {2T} in the abdomen.',
			'{1} sets {2T} on fire with a molotov.',
			'{1T} falls into a pit and dies.',
			'{1} stabs {2T} while their back is turned.',
			'{1} severely injures {2T}, but puts them out of their misery.',
			'{1} severely injures {2T} and leaves them to die.',
			"{1} bashes {2T}'s head in with a mace.",
			'{1T} attempts to climb a tree, but falls to their death.',
			'{1} pushes {2T} off a cliff during a knife fight.',
			"{1} throws a knife into {2T}'s chest.",
			"{1}'s trap kills {2T}.",
			'{1} kills {2T} while they are sleeping.',
			'{1T} is unable to convince {2} to not kill them.',
			'{1} convinces {2T} to not kill them, only to kill {2T} instead.',
			'{1T} falls into a frozen lake and drowns.',
			'{1}, {2}, and {3T} start fighting, but {2} runs away as {1} kills {3T}.',
			'{1} kills {2T} with their own weapon.',
			'{1} overpowers {2T}, killing them.',
			'{1} sets an explosive off, killing {2T}.',
			'{1} sets an explosive off, killing {2T}, and {3T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, and {4T}.',
			'{1} sets an explosive off, killing {2T}, {3T}, {4T} and {5T}.',
			'{1} kills {2T} as they try to run.',
			'{1T} and {2T} threaten a double suicide. It fails and they die.',
			'{1T}, {2T}, {3T}, and {4T} form a suicide pact, killing themselves.',
			'{1T} dies from hypothermia.',
			'{1T} dies from hunger.',
			'{1T} dies from thirst.',
			'{1} kills {2T} with a hatchet.',
			'{1} and {2} fight {3T} and {4T}. {1} and {2} survive.',
			'{1T} and {2T} fight {3} and {4}. {3} and {4} survive.',
			'{1T} dies trying to escape the arena.',
			'{1T} dies of dysentery.',
			'{1T} accidently detonates a land mine while trying to arm it.',
			'{1T} attacks {2}, but {3} protects them, killing {1T}.',
			'{1} ambushes {2T} and kills them.',
			'{1T} accidently steps on a landmine.',
			'{1} severely slices {2T} with a sword.',
			'{1} strangles {2T} with a rope.',
			'{1} kills {2T} for their supplies.',
			'{1} shoots an arrow at {2}, but misses and kills {3T} instead.',
			"{1} shoots a poisonous blow dart into {2T}'s neck, slowly killing them.",
			'{1}, {2}, and {3} successfully ambush and kill {4T}, {5T}, and {6T}.',
			'{1T}, {2T}, and {3T} unsuccessfully ambush {4}, {5}, and {6}, who kill them instead.',
			'{1} stabs {2T} with a tree branch.',
			'{1} forces {2} to kill {3T} or {4}. They decide to kill {3T}.',
			'{1} forces {2} to kill {3} or {4T}. They decide to kill {4T}.',
			'{1} forces {2T} to kill {3} or {4}. They refuse to kill, so {1} kills them instead.',
			"{1T} poisons {2}'s drink, but mistakes it for their own and dies.",
			"{1} poisons {2T}'s drink. They drink it and die.",
			'{1} stabs {2T} in the back with a trident.',
			'{1T} attempts to climb a tree, but falls on {2T}, killing them both.',
			'{1}, {2T}, and {3T} get into a fight. {1} triumphantly kills them both.',
			'{1T}, {2}, and {3T} get into a fight. {2} triumphantly kills them both.',
			'{1T}, {2T}, and {3} get into a fight. {3} triumphantly kills them both.',
			'{1} kills {2T} with a sickle.',
			'{1}, {2}, {3}, {4}, and {5} track down and kill {6T}.',
			'{1}, {2}, {3}, and {4} track down and kill {5T}.',
			'{1}, {2}, and {3} track down and kill {4T}.',
			'{1} and {2} track down and kill {3T}.',
			'{1} tracks down and kills {2T}.',
			'{1} repeatedly stabs {2T} to death with sais.',
			'{1} writes in their journal.',
			'{1} watches {2} sitting at their campfire, and considers killing them.'
		].map(HungerGamesUsage.create),

		/**
		 * #################################
		 * #          SERIALIZERS          #
		 * #################################
		 */

		SERIALIZER_AUTOROLE_INVALID: 'Invalid autorole data.',
		SERIALIZER_COMMAND_AUTO_DELETE_INVALID: 'Invalid command auto-delete data.',
		SERIALIZER_CUSTOM_COMMAND_INVALID: 'Invalid custom command data.',
		SERIALIZER_DISABLED_COMMAND_CHANNEL_INVALID: 'Invalid disabled command channel data.',
		SERIALIZER_PERMISSION_NODE_DUPLICATED_COMMAND: ({ command }) => `You have set \`${command}\` twice, either allow it, or deny it.`,
		SERIALIZER_PERMISSION_NODE_INVALID_COMMAND: ({ command }) => `The command \`${command}\` does not exist or is invalid.`,
		SERIALIZER_PERMISSION_NODE_INVALID_TARGET: 'No data could be found from the ID.',
		SERIALIZER_PERMISSION_NODE_INVALID: 'Invalid data.',
		SERIALIZER_PERMISSION_NODE_SECURITY_EVERYONE_ALLOWS: 'For security, the everyone role cannot have allows.',
		SERIALIZER_PERMISSION_NODE_SECURITY_GUARDED: ({ command }) =>
			`For security and for me to work properly, you cannot deny the usage for the command \`${command}\`.`,
		SERIALIZER_PERMISSION_NODE_SECURITY_OWNER: 'You cannot set permission overrides on the server owner.',
		SERIALIZER_REACTION_ROLE_INVALID: 'Invalid reaction role data.',
		SERIALIZER_STICKY_ROLE_INVALID: 'Invalid sticky role data.',
		SERIALIZER_TRIGGER_ALIAS_INVALID: 'Invalid trigger alias data.',
		SERIALIZER_TRIGGER_INCLUDE_INVALID: 'Invalid trigger includes data.',
		SERIALIZER_TWITCH_SUBSCRIPTION_INVALID_STREAMER: 'Invalid data streamer.',
		SERIALIZER_TWITCH_SUBSCRIPTION_INVALID: 'Invalid data.',
		SERIALIZER_UNIQUE_ROLE_SET_INVALID: 'Invalid unique role set data.',

		/**
		 * #################################
		 * #        NOTIFICATIONS          #
		 * #################################
		 */
		NOTIFICATIONS_TWITCH_NO_GAME_NAME: '*Game name not set*',
		NOTIFICATIONS_TWITCH_EMBED_DESCRIPTION: ({ userName, gameName }) => `${userName} is now live${gameName ? ` - Streaming ${gameName}!` : '!'}`,
		NOTIFICATION_TWITCH_EMBED_FOOTER: 'Skyra Twitch Notifications',

		/**
		 * #################################
		 * #             UTILS             #
		 * #################################
		 */

		SELF_MODERATION_COMMAND_INVALID_MISSING_ACTION: ({ name }) =>
			`${REDCROSS} Action must be any of the following: \`enable\`, \`disable\`, \`action\`, \`punish\`, \`punish-duration\`, \`threshold-maximum\`, \`threshold-duration\`, or \`show\`. Check \`Skyra, help ${name}\` for more information.`,
		SELF_MODERATION_COMMAND_INVALID_MISSING_ARGUMENTS: ({ name }) =>
			`${REDCROSS} The specified action requires an extra argument to be passed. Check \`Skyra, help ${name}\` for more information.`,
		SELF_MODERATION_COMMAND_INVALID_SOFTACTION: ({ name }) =>
			`${REDCROSS} Value must be any of the following: \`alert\`, \`log\`, or \`delete\`. Check \`Skyra, help ${name}\` for more information.`,
		SELF_MODERATION_COMMAND_INVALID_HARDACTION: ({ name }) =>
			`${REDCROSS} Value must be any of the following: \`none\`, \`warn\`, \`mute\`, \`kick\`, \`softban\`, or \`ban\`. Check \`Skyra, help ${name}\` for more information.`,
		SELF_MODERATION_COMMAND_ENABLED: `${GREENTICK} Successfully enabled sub-system.`,
		SELF_MODERATION_COMMAND_DISABLED: `${GREENTICK} Successfully disabled sub-system.`,
		SELF_MODERATION_COMMAND_SOFT_ACTION: ({ value }) =>
			value ? `${GREENTICK} Successfully set actions to: \`${value}\`` : `${GREENTICK} Successfully disabled actions.`,
		SELF_MODERATION_COMMAND_HARD_ACTION: ({ value }) => `${GREENTICK} Successfully set punishment: ${value}`,
		SELF_MODERATION_COMMAND_HARD_ACTION_DURATION: ({ value }) =>
			value
				? `${GREENTICK} Successfully set the punishment appeal timer to: ${duration(value)}`
				: `${GREENTICK} Successfully removed the punishment appeal timer.`,
		SELF_MODERATION_COMMAND_THRESHOLD_MAXIMUM: ({ value }) =>
			value
				? `${GREENTICK} Successfully set the threshold maximum to: ${value}`
				: `${GREENTICK} Successfully removed the threshold maximum, punishment will take place instantly if set.`,
		SELF_MODERATION_COMMAND_THRESHOLD_DURATION: ({ value }) =>
			value
				? `${GREENTICK} Successfully set the threshold duration to: ${duration(value)}`
				: `${GREENTICK} Successfully removed the threshold duration, punishments will take place instantly if set.`,
		SELF_MODERATION_COMMAND_SHOW: ({ kEnabled, kAlert, kLog, kDelete, kHardAction, hardActionDuration, thresholdMaximum, thresholdDuration }) =>
			[
				`Enabled      : ${kEnabled}`,
				'Action',
				` - Alert     : ${kAlert}`,
				` - Log       : ${kLog}`,
				` - Delete    : ${kDelete}`,
				'Punishment',
				` - Type      : ${kHardAction}`,
				` - Duration  : ${hardActionDuration === null ? 'Permanent' : duration(hardActionDuration)}`,
				'Threshold',
				` - Maximum   : ${thresholdMaximum ? thresholdMaximum : 'Unset'}`,
				` - Duration  : ${thresholdDuration ? duration(thresholdDuration) : 'Unset'}`
			].join('\n'),
		SELF_MODERATION_SOFT_ACTION_ALERT: 'Alert',
		SELF_MODERATION_SOFT_ACTION_LOG: 'Log',
		SELF_MODERATION_SOFT_ACTION_DELETE: 'Delete',
		SELF_MODERATION_HARD_ACTION_BAN: 'Ban',
		SELF_MODERATION_HARD_ACTION_KICK: 'Kick',
		SELF_MODERATION_HARD_ACTION_MUTE: 'Mute',
		SELF_MODERATION_HARD_ACTION_SOFTBAN: 'SoftBan',
		SELF_MODERATION_HARD_ACTION_WARNING: 'Warning',
		SELF_MODERATION_HARD_ACTION_NONE: 'None',
		SELF_MODERATION_ENABLED: 'Yes',
		SELF_MODERATION_DISABLED: 'No',
		SELF_MODERATION_MAXIMUM_TOO_SHORT: ({ minimum, value }) => `${REDCROSS} The value (${value}) was too short, expected at least ${minimum}.`,
		SELF_MODERATION_MAXIMUM_TOO_LONG: ({ maximum, value }) => `${REDCROSS} The value (${value}) was too long, expected maximum ${maximum}.`,
		SELF_MODERATION_DURATION_TOO_SHORT: ({ minimum, value }) =>
			`${REDCROSS} The value (${duration(value)}) was too short, expected at least ${duration(minimum)}.`,
		SELF_MODERATION_DURATION_TOO_LONG: ({ maximum, value }) =>
			`${REDCROSS} The value (${duration(value)}) was too long, expected maximum ${duration(maximum)}.`,

		ACTION_MUTE_REASON: ({ reason }) => (reason === null ? '[Action] Applied Mute.' : `[Action] Applied Mute | Reason: ${reason}`),
		ACTION_UNMUTE_REASON: ({ reason }) => (reason === null ? '[Action] Revoked Mute.' : `[Action] Revoked Mute | Reason: ${reason}`),
		ACTION_KICK_REASON: ({ reason }) => (reason === null ? '[Action] Applied Kick.' : `[Action] Applied Kick | Reason: ${reason}`),
		ACTION_SOFTBAN_REASON: ({ reason }) => (reason === null ? '[Action] Applying Softban.' : `[Action] Applying Softban | Reason: ${reason}`),
		ACTION_UNSOFTBAN_REASON: ({ reason }) => (reason === null ? '[Action] Applied Softban.' : `[Action] Applied Softban | Reason: ${reason}`),
		ACTION_BAN_REASON: ({ reason }) => (reason === null ? '[Action] Applied Ban' : `[Action] Applied Ban | Reason: ${reason}`),
		ACTION_UNBAN_REASON: ({ reason }) => (reason === null ? '[Action] Applied Unban.' : `[Action] Applied Unban | Reason: ${reason}`),
		ACTION_VMUTE_REASON: ({ reason }) => (reason === null ? '[Action] Applied Voice Mute.' : `[Action] Applied Voice Mute | Reason: ${reason}`),
		ACTION_UNVMUTE_REASON: ({ reason }) => (reason === null ? '[Action] Revoked Voice Mute.' : `[Action] Revoked Voice Mute | Reason: ${reason}`),
		ACTION_VKICK_REASON: ({ reason }) => (reason === null ? '[Action] Applied Voice Kick.' : `[Action] Applied Voice Kick | Reason: ${reason}`),
		ACTION_RESTRICTED_REACT_REASON: ({ reason }) =>
			reason === null ? '[Action] Applied Reaction Restriction.' : `[Action] Applied Reaction Restriction | Reason: ${reason}`,
		ACTION_RESTRICTED_EMBED_REASON: ({ reason }) =>
			reason === null ? '[Action] Applied Embed Restriction.' : `[Action] Applied Embed Restriction | Reason: ${reason}`,
		ACTION_RESTRICTED_ATTACHMENT_REASON: ({ reason }) =>
			reason === null ? '[Action] Applied Attachment Restriction.' : `[Action] Applied Attachment Restriction | Reason: ${reason}`,
		ACTION_RESTRICTED_VOICE_REASON: ({ reason }) =>
			reason === null ? '[Action] Applied Voice Restriction.' : `[Action] Applied Voice Restriction | Reason: ${reason}`,
		ACTION_SET_NICKNAME: ({ reason, nickname }) =>
			reason === null
				? `[Action] ${nickname ? 'Set Nickname' : 'Removed Nickname'}.`
				: `[Action] ${nickname ? 'Set Nickname' : 'Removed Nickname'} | Reason: ${reason}`,
		ACTION_ADD_ROLE: ({ reason }) => (reason === null ? '[Action] Added Role.' : `[Action] Added Role | Reason: ${reason}`),
		ACTION_REMOVE_ROLE: ({ reason }) => (reason === null ? '[Action] Removed Role.' : `[Action] Removed Role | Reason: ${reason}`),
		ACTION_REQUIRED_MEMBER: 'The user does not exist or is not in this server.',
		ACTION_SETUP_MUTE_EXISTS: '**Aborting mute role creation**: There is already one that exists.',
		ACTION_SETUP_RESTRICTION_EXISTS: '**Aborting restriction role creation**: There is already one that exists.',
		ACTION_SETUP_TOO_MANY_ROLES: '**Aborting role creation**: There are 250 roles in this guild, you need to delete one role.',
		ACTION_SHARED_ROLE_SETUP_EXISTING: 'I could not find a configured role. Do you want to configure an existing one?',
		ACTION_SHARED_ROLE_SETUP_EXISTING_NAME: 'Please give me the name of the role you want to use for further actions of this type.',
		ACTION_SHARED_ROLE_SETUP_NEW: 'Do you want me to create a new role and configure it automatically?',
		ACTION_SHARED_ROLE_SETUP: ({ role, channels, permissions }) =>
			`${LOADING} Can I modify ${channels} ${channels === 1 ? 'channel' : 'channels'} to apply the role ${role} the following ${
				permissions.length === 1 ? 'permission' : 'permissions'
			}: \`${permissions.join('`, `')}\`?`,
		MUTE_NOT_CONFIGURED: 'The muted role must be configured for this action to happen.',
		RESTRICTION_NOT_CONFIGURED: 'The restriction role must be configured for this action to happen',
		MUTE_NOT_IN_MEMBER: 'The muted role is not set in the member.',
		MUTE_LOW_HIERARCHY: 'I cannot mute a user which higher role hierarchy than me.',
		MUTE_CANNOT_MANAGE_ROLES: `I must have **${PERMS.MANAGE_ROLES}** permissions to be able to mute.`,
		MUTE_NOT_EXISTS: 'The specified user is not muted.',

		RESOLVER_DATE_SUFFIX: ' seconds',
		RESOLVER_POSITIVE_AMOUNT: 'You must give me a positive number.',
		POWEREDBY_WEEBSH: 'Powered by weeb.sh',
		PREFIX_REMINDER: ({ prefix }) => `The prefix in this guild is set to: \`${prefix}\``,

		UNEXPECTED_ISSUE: 'An unexpected error popped up! Safely aborting this command...',

		COMMAND_DM_NOT_SENT: 'I cannot send you a message in DMs, did you block me?',
		COMMAND_DM_SENT: 'I have sent you the message in DMs.',
		COMMAND_ROLE_HIGHER_SKYRA: 'The selected member has a role position that is higher than or equal to mine.',
		COMMAND_ROLE_HIGHER: 'The selected member has a role position that is higher than or equal to yours.',
		COMMAND_SUCCESS: 'Successfully executed the command.',
		COMMAND_TOSKYRA: 'Why... I thought you loved me! 💔',
		COMMAND_USERSELF: 'Why would you do that to yourself?',

		SYSTEM_FETCHING: createPick([
			`${LOADING} Downloading data...`,
			`${LOADING} Fetching Commander Data...`,
			`${LOADING} Chasing after starships...`
		]),
		SYSTEM_PARSE_ERROR: `${REDCROSS} I failed to process the data I was given, sorry~!`,
		SYSTEM_HIGHEST_ROLE: "This role's hierarchy position is higher or equal than me, I am not able to grant it to anyone.",
		SYSTEM_CHANNEL_NOT_POSTABLE: 'I am not allowed to send messages to this channel.',
		SYSTEM_FETCHBANS_FAIL: `Failed to fetch bans. Do I have the **${PERMS.BAN_MEMBERS}** permission?`,
		SYSTEM_LOADING: createPick([
			`${LOADING} Watching hamsters run...`,
			`${LOADING} Finding people at hide-and-seek...`,
			`${LOADING} Trying to figure out this command...`,
			`${LOADING} Fetching data from the cloud...`,
			`${LOADING} Calibrating lenses...`,
			`${LOADING} Playing rock, scissors, paper...`
		]),
		SYSTEM_ERROR: `Something bad happened! Please try again, or if the issue keeps happening join the support server (hint: use \`Skyra, support\`)`,
		SYSTEM_DATABASE_ERROR: `I wasn't able get that in my database! Please try again, or if the issue keeps happening join the support server (hint: use \`Skyra, support\`)`,
		SYSTEM_DISCORD_ABORTERROR: 'I had a small network error when messaging Discord, please run this command again!',
		SYSTEM_MESSAGE_NOT_FOUND: 'I am sorry, but either you wrote the message ID incorrectly, or it got deleted.',
		SYSTEM_NOTENOUGH_PARAMETERS: 'I am sorry, but you did not provide enough parameters...',
		SYSTEM_GUILD_MUTECREATE_APPLYING: ({ channels, role }) => `Applying permissions (\`SEND_MESSAGES\`:\`false\`) for ${channels} to ${role}...`,
		SYSTEM_GUILD_MUTECREATE_EXCEPTIONS: ({ denied }) => (denied.length > 1 ? `, with exception of ${denied.join(', ')}.` : '. '),
		SYSTEM_GUILD_MUTECREATE_APPLIED: ({ accepted, exceptions, author, role }) =>
			`Permissions applied for ${accepted} channels${exceptions}Dear ${author}, don't forget to tweak the permissions in the channels you want ${role} to send messages.`,
		SYSTEM_QUERY_FAIL: 'I am sorry, but the application could not resolve your request. Are you sure you wrote the name correctly?',
		SYSTEM_NO_RESULTS: "I wasn't able to find any results for that query",
		SYSTEM_CANNOT_ACCESS_CHANNEL: 'I am sorry, but you do not have permission to see that channel.',
		SYSTEM_EXCEEDED_LENGTH_OUTPUT: ({ output, time, type }) =>
			`**Output**:${output}${type !== undefined && time !== undefined ? `\n**Type**:${type}\n${time}` : ''}`,
		SYSTEM_EXCEEDED_LENGTH_OUTPUT_CONSOLE: ({ time, type }) =>
			`Sent the result to console.${type !== undefined && time !== undefined ? `\n**Type**:${type}\n${time}` : ''}`,
		SYSTEM_EXCEEDED_LENGTH_OUTPUT_FILE: ({ time, type }) =>
			`Sent the result as a file.${type !== undefined && time !== undefined ? `\n**Type**:${type}\n${time}` : ''}`,
		SYSTEM_EXCEEDED_LENGTH_OUTPUT_HASTEBIN: ({ url, time, type }) =>
			`Sent the result to hastebin: ${url}${type !== undefined && time !== undefined ? `\n**Type**:${type}\n${time}` : ''}`,
		SYSTEM_EXCEEDED_LENGTH_CHOOSE_OUTPUT: ({ output }) => `Choose one of the following options: ${this.list(output, 'or')}`,
		SYSTEM_EXTERNAL_SERVER_ERROR: 'The external service we use could not process our message. Please try again later.',
		SYSTEM_POKEDEX_EXTERNAL_RESOURCE: 'External Resources',
		JUMPTO: 'Jump to Message ►',

		RESOLVER_INVALID_CHANNELNAME: ({ name }) => `${name} must be a valid channel name, id, or tag.`,
		RESOLVER_INVALID_ROLENAME: ({ name }) => `${name} must be a valid role name, id, or mention.`,
		RESOLVER_INVALID_USERNAME: ({ name }) => `${name} must be a valid user name, id, or mention.`,
		RESOLVER_CHANNEL_NOT_IN_GUILD: 'I am sorry, but that command can only be ran in a server.',
		RESOLVER_CHANNEL_NOT_IN_GUILD_SUBCOMMAND: ({ command, subcommand }) =>
			`${REDCROSS} I am sorry, but the subcommand \`${subcommand}\` for the command \`${command}\` can only be used in a server.`,
		RESOLVER_MEMBERNAME_USER_LEFT_DURING_PROMPT: 'User left during prompt.',

		LISTIFY_PAGE: ({ page, pageCount, results }) => `Page ${page} / ${pageCount} | ${results} Total`,

		MODERATION_LOG_APPEALED: `${REDCROSS} I am sorry, but the selected moderation log has expired or cannot be cannot be made temporary.`,
		MODERATION_LOG_EXPIRES_IN: ({ duration }) => `\n❯ **Expires In**: ${this.duration(duration)}`,
		MODERATION_LOG_DESCRIPTION: ({ data: { caseID, formattedDuration, prefix, reason, type, userDiscriminator, userID, userName } }) =>
			[
				`❯ **Type**: ${type}`,
				`❯ **User:** ${userName}#${userDiscriminator} (${userID})`,
				`❯ **Reason:** ${reason || `Please use \`${prefix}reason ${caseID} <reason>\` to set the reason.`}${formattedDuration}`
			].join('\n'),
		MODERATION_LOG_FOOTER: ({ caseID }) => `Case ${caseID}`,
		MODERATION_CASE_NOT_EXISTS: `${REDCROSS} I am sorry, but the selected moderation log case does not exist.`,
		MODERATION_CASES_NOT_EXIST: `${REDCROSS} I am sorry, but none of the selected moderation log cases exist.`,

		GUILD_SETTINGS_CHANNELS_MOD: 'You need to configure a modlog channel. Use `Skyra, conf set channels.moderation-logs #modlogs`.',
		GUILD_SETTINGS_ROLES_RESTRICTED: ({ prefix, path }) =>
			`${REDCROSS} You need to configure a role for this action, use \`${prefix}settings set ${path} <rolename>\` to set it up.`,
		GUILD_MUTE_NOT_FOUND:
			'I failed to fetch the modlog that sets this user as muted. Either you did not mute this user or all the mutes are appealed.',
		GUILD_BANS_EMPTY: 'There are no bans registered in this server.',
		GUILD_BANS_NOT_FOUND: 'I tried and failed to find this user from the ban list. Are you certain this user is banned?',
		CHANNEL_NOT_READABLE: `I am sorry, but I need the permissions **${PERMS.VIEW_CHANNEL}** and **${PERMS.READ_MESSAGE_HISTORY}**`,

		USER_NOT_IN_GUILD: 'This user is not in this server.',
		USER_NOT_EXISTENT: 'This user does not exist. Are you sure you used a valid user ID?',

		EVENTS_GUILDMEMBERADD: 'User Joined',
		EVENTS_GUILDMEMBERADD_MUTE: 'Muted User joined',
		EVENTS_GUILDMEMBERADD_RAID: 'Raid Detected',
		EVENTS_GUILDMEMBERADD_DESCRIPTION: ({ mention, time }) => `${mention} | **Joined Discord**: ${duration(time, 2)} ago.`,
		EVENTS_GUILDMEMBERREMOVE: 'User Left',
		EVENTS_GUILDMEMBERKICKED: 'User Kicked',
		EVENTS_GUILDMEMBERBANNED: 'User Banned',
		EVENTS_GUILDMEMBERSOFTBANNED: 'User Softbanned',
		EVENTS_GUILDMEMBERREMOVE_DESCRIPTION: ({ mention, time }) =>
			`${mention} | **Joined Server**: ${time === -1 ? 'Unknown' : `${duration(time, 2)} ago`}.`,
		EVENTS_GUILDMEMBER_UPDATE_NICKNAME: ({ previous, current }) => `Updated the nickname from **${previous}** to **${current}**`,
		EVENTS_GUILDMEMBER_ADDED_NICKNAME: ({ current }) => `Added a new nickname **${current}**`,
		EVENTS_GUILDMEMBER_REMOVED_NICKNAME: ({ previous }) => `Removed the nickname **${previous}**`,
		EVENTS_GUILDMEMBER_UPDATE_ROLES: ({ removed, added }) =>
			`${removed.length > 0 ? `Removed the role${removed.length > 1 ? 's' : ''}: ${removed.join(', ')}\n` : ''}${
				added.length > 0 ? `Added the role${added.length > 1 ? 's' : ''}: ${added.join(', ')}` : ''
			}`,
		EVENTS_NICKNAME_UPDATE: 'Nickname Edited',
		EVENTS_USERNAME_UPDATE: 'Username Edited',
		EVENTS_NAME_DIFFERENCE: ({ previous, next }) =>
			[`**Previous**: ${previous === null ? 'Unset' : `\`${previous}\``}`, `**Next**: ${next === null ? 'Unset' : `\`${next}\``}`].join('\n'),
		EVENTS_ROLE_DIFFERENCE: ({ addedRoles, removedRoles }) =>
			[
				addedRoles.length ? `**Added role${addedRoles.length === 1 ? '' : 's'}**: ${addedRoles.join(', ')}` : null,
				removedRoles.length ? `**Removed role${removedRoles.length === 1 ? '' : 's'}**: ${removedRoles.join(', ')}` : ''
			].join('\n'),
		EVENTS_ROLE_UPDATE: 'Roles Edited',
		EVENTS_MESSAGE_UPDATE: 'Message Edited',
		EVENTS_MESSAGE_DELETE: 'Message Deleted',
		EVENTS_REACTION: 'Reaction Added',
		EVENTS_COMMAND: ({ command }) => `Command Used: ${command}`,

		SETTINGS_DELETE_CHANNELS_DEFAULT: 'Reseated the value for `channels.default`',
		SETTINGS_DELETE_ROLES_INITIAL: 'Reseated the value for `roles.initial`',
		SETTINGS_DELETE_ROLES_MUTE: 'Reseated the value for `roles.muted`',

		MODLOG_TIMED: ({ remaining }) => `This moderation log is already timed. Expires in ${duration(remaining)}`,

		GUILD_WARN_NOT_FOUND: 'I failed to fetch the modlog for appealing. Either it does not exist, is not type of warning, or it is appealed.',
		GUILD_MEMBER_NOT_VOICECHANNEL: 'I cannot execute this action in a member that is not connected to a voice channel.',

		PROMPTLIST_MULTIPLE_CHOICE: ({ list, amount }) =>
			`There are ${amount} ${
				amount === 1 ? 'result' : 'results'
			}. Please choose a number between 1 and ${amount}, or write **"CANCEL"** to cancel the prompt.\n${list}`,
		PROMPTLIST_ATTEMPT_FAILED: ({ list, attempt, maxAttempts }) => `Invalid input. Attempt **${attempt}** out of **${maxAttempts}**\n${list}`,
		PROMPTLIST_ABORTED: 'Successfully aborted the prompt.',

		FUZZYSEARCH_MATCHES: ({ matches, codeblock }) =>
			`I found multiple matches! **Please select a number within 0 and ${matches}**:\n${codeblock}\nWrite **ABORT** if you want to exit the prompt.`,
		FUZZYSEARCH_INVALID_NUMBER: 'I expected you to give me a (single digit) number, got a potato.',
		FUZZYSEARCH_INVALID_INDEX: 'That number was out of range, aborting prompt.',

		EVENTS_ERROR_WTF: `${REDCROSS} What a Terrible Failure! I am very sorry!`,
		EVENTS_ERROR_STRING: ({ mention, message }) => `${REDCROSS} Dear ${mention}, ${message}`,

		CONST_USERS: 'Users',
		UNKNOWN_CHANNEL: 'Unknown channel',
		UNKNOWN_ROLE: 'Unknown role',
		UNKNOWN_USER: 'Unknown user'
	};

	public async init() {
		// noop
	}
}
