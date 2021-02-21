﻿namespace Skyra.Database.Models
{
	public struct PointsQuery
	{
		public long Points { get; set; }
		public bool Success { get; set; }
		public string? FailureReason { get; set; }
	}
}
