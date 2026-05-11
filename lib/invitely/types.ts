export type InvitelySessionSummary = {
  id: string;
  clientName: string;
  projectName: string;
  countries: string[];
  createdAt: string;
};

export type InvitelyAttendee = {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  inviteAll: boolean;
  selectedCountries: string[];
  updatedAt: string;
};

export type InvitelyChangelogEntry = {
  id: string;
  actorName: string;
  action: "add" | "update" | "delete";
  attendeeLabel: string;
  inviteAll: boolean | null;
  selectedCountries: string[] | null;
  createdAt: string;
};
