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

