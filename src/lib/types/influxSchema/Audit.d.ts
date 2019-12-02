export const enum AuditMeasurements {
	SettingsUpdate = 'SETTINGS_UPDATE',
	Announcement = 'ANNOUNCEMENT'
}

export const enum AuditTags {
	Target = 'target'
}

export const enum AuditSettingsTarget {
	Guild = 'guild',
	User = 'user',
	Client = 'client'
}

export const enum AuditAnnouncementAction {
	Send = 'SEND',
	Edit = 'EDIT',
	Error = 'ERROR'
}
