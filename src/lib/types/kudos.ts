export type KudosType =
  | "teamwork"
  | "innovation"
  | "leadership"
  | "customer_focus"
  | "excellence"
  | "growth"
  | "custom";

export type CompanyValue =
  | "integrity"
  | "innovation"
  | "collaboration"
  | "excellence"
  | "customer_first";

export type ReactionType = "heart" | "fire" | "clap" | "star" | "rocket" | "celebrate";

/**
 * §5.1 (Correction 2 feedback) — the client asked why Kudos could only be
 * sent to one colleague, recalling a department/team option that git
 * history shows never actually existed in this codebase (there's no
 * regression to restore, just a capability to add). "team" reuses the
 * department roster as its source list — there is no separate team entity
 * modelled anywhere else in the app.
 */
export type KudosRecipientType = "individual" | "department" | "team";

export interface KudosReaction {
  type: ReactionType;
  users: string[];
  count: number;
  reactedBy: string[];
}

export interface KudosComment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorDept?: string;
  message: string;
  createdAt: string;
}

export interface KudosPost {
  id: string;
  senderName: string;
  senderInitials: string;
  senderDept: string;
  recipientName: string;
  recipientInitials: string;
  recipientDept: string;
  /** Absent on older posts, which were always individual recipients. */
  recipientType?: KudosRecipientType;
  kudosType: KudosType;
  companyValue: CompanyValue;
  message: string;
  reactions: KudosReaction[];
  comments: KudosComment[];
  createdAt: string;
  isPublic: boolean;
  isBroadcast?: boolean;
  isPinned?: boolean;
  customTypeName?: string;
  isPrivate?: boolean;
}

export interface NewKudos {
  recipientName: string;
  recipientInitials: string;
  recipientDept: string;
  recipientType?: KudosRecipientType;
  kudosType: KudosType;
  companyValue: CompanyValue;
  message: string;
  isPublic: boolean;
  isBroadcast?: boolean;
  isPrivate?: boolean;
  customTypeName?: string;
}

export interface KudosLeaderboardEntry {
  id: string;
  name: string;
  initials: string;
  department: string;
  employeeName: string;
  employeeInitials: string;
  rank: number;
  kudosReceived: number;
  kudosSent: number;
  streak: number;
  dept?: string;
}

