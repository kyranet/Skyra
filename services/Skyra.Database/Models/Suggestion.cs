﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

#nullable disable

namespace Skyra.Database.Models
{
	[Table("suggestion")]
	public partial class Suggestion
	{
		[Key]
		[Column("id")]
		public int Id { get; set; }
		[Key]
		[Column("guild_id")]
		[StringLength(19)]
		public string GuildId { get; set; }
		[Required]
		[Column("message_id")]
		[StringLength(19)]
		public string MessageId { get; set; }
		[Required]
		[Column("author_id")]
		[StringLength(19)]
		public string AuthorId { get; set; }
	}
}
