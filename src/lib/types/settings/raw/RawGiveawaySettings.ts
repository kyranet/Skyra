export interface RawGiveawaySettings {
	title: string;
	ends_at: number;
	guild_id: string;
	channel_id: string;
	message_id: string;
	minimum: number;
	minimum_winners: number;
}

export const SQL_TABLE_SCHEMA = /* sql */`
	CREATE TABLE IF NOT EXISTS giveaway (
		"title"           VARCHAR(256)          NOT NULL,
		"ends_at"         TIMESTAMP             NOT NULL,
		"guild_id"        VARCHAR(19)           NOT NULL,
		"channel_id"      VARCHAR(19)           NOT NULL,
		"message_id"      VARCHAR(19)           NOT NULL,
		"minimum"         INTEGER     DEFAULT 1 NOT NULL CHECK(minimum <> 0),
		"minimum_winners" INTEGER     DEFAULT 1 NOT NULL CHECK(minimum_winners <> 0),
		CONSTRAINT giveaway_guild_message_idx   PRIMARY KEY("guild_id", "message_id")
	);
`;
