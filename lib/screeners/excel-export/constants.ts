/** Recruitment log export — see EXCEL_EXPORT_SPEC.md */

export const FONT = "Calibri";

export const COLORS = {
  titleText: "FF0A0C28",
  mutedText: "FF767171",
  brandBlue: "FF109AC0",
  darkNavy: "FF1F3864",
  mediumBlue: "FF2E75B6",
  white: "FFFFFFFF",
  altRowGrey: "FFF2F2F2",
  /** Mid-tone grey borders across the recruitment log table. */
  borderTable: "FF9E9E9E",
  borderMedium: "FF808080",
} as const;

/** Core columns that use TRUE/FALSE checkbox validation in data rows. */
export const CHECKBOX_COLUMN_NUMBERS = [10, 11, 13] as const;

export const SYSTEM_MARKER = "__ss_v1__";

export const FIXED_CORE_COLUMN_COUNT = 13;

export const DATA_ROW_COUNT = 20;

export const FIRST_DATA_ROW = 9;

export const HEADER_ROW = 7;

export const SUB_HEADER_ROW = 8;

export const GROUP_HEADER_ROW = 6;

export const MARKER_ROW = 5;

export const STATUS_VALIDATION_LIST =
  "Newly Confirmed,Confirmed,Rescheduled - Confirmed,Completed,Scheduled,Qualified,Rescheduling,Terminated,Cancelled,Screenout/Review,Pilot day,To be replaced";

export const CORE_COLUMNS: {
  key: string;
  header: string;
  width: number;
}[] = [
  { key: "respondent_id", header: "Respondent ID", width: 12 },
  { key: "status", header: "Status", width: 22 },
  { key: "country", header: "Country", width: 14 },
  { key: "specialty", header: "Specialty / Segment", width: 18 },
  { key: "interview_date", header: "Interview Date", width: 14 },
  { key: "time_est", header: "Time (EST)", width: 12 },
  { key: "time_local", header: "Time (Local)", width: 12 },
  { key: "language", header: "Language", width: 12 },
  { key: "recruiter", header: "Recruiter", width: 14 },
  { key: "observer_invite_sent", header: "Observer Invite Sent", width: 20 },
  { key: "audio_saved", header: "Audio Saved", width: 10 },
  { key: "transcripts_eta", header: "Transcripts ETA", width: 16 },
  { key: "transcription_received", header: "Transcription Received", width: 22 },
];

export const SCREENER_RESPONSE_COLUMN_WIDTH = 10;

export const COLUMN_GROUPS: {
  label: string;
  startCol: number;
  endCol: number;
}[] = [
  { label: "Respondent", startCol: 1, endCol: 2 },
  { label: "Profile", startCol: 3, endCol: 4 },
  { label: "Scheduling", startCol: 5, endCol: 8 },
  { label: "Fieldwork", startCol: 9, endCol: 9 },
  { label: "Recording Processing", startCol: 10, endCol: 13 },
];

export const STATUS_CONDITIONAL_RULES: {
  value: string;
  fill: string;
  font: string;
  bold?: boolean;
}[] = [
  { value: "Completed", fill: "FFC6EFCE", font: "FF276221" },
  { value: "Confirmed", fill: "FFDDEBF7", font: "FF1F3864" },
  { value: "Newly Confirmed", fill: "FFBDD7EE", font: "FF1F3864" },
  { value: "Rescheduled - Confirmed", fill: "FFFCE4D6", font: "FF833C00" },
  { value: "Scheduled", fill: "FFEBF3FB", font: "FF2E75B6" },
  { value: "Qualified", fill: "FFEBF3FB", font: "FF2E75B6" },
  { value: "Rescheduling", fill: "FFFFF2CC", font: "FF7F6000" },
  { value: "Terminated", fill: "FFFFCCCC", font: "FFC00000", bold: true },
  { value: "Cancelled", fill: "FFBFBFBF", font: "FF404040" },
  { value: "Screenout/Review", fill: "FFFF0000", font: "FFFFFFFF", bold: true },
  { value: "Pilot day", fill: "FFE2EFDA", font: "FF375623" },
  { value: "To be replaced", fill: "FFF2F2F2", font: "FF767171" },
];
