﻿using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Skyra.Database.Models.Entities
{
	[Table("youtube_subscription")]
	public class YoutubeSubscription
	{
		[Key]
		[Column("id")]
		[StringLength(11)]
		public string Id { get; set; }

		[Column("expires_at")]
		public DateTime ExpiresAt { get; set; }

		[Required]
		[Column("guild_ids", TypeName = "character varying(19)[]")]
		public string[] GuildIds { get; set; }
	}
}
