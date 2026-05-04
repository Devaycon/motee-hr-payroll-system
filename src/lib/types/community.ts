export type PostType = "update" | "shoutout" | "event" | "poll" | "milestone";

export type CelebrationKind = "birthday" | "anniversary" | "new_hire" | "promotion";

export interface PollOption {
  id: string;
  label: string;
  votes: string[];
}

export interface PostComment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorDept: string;
  message: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  type: PostType;
  authorName: string;
  authorInitials: string;
  authorDept: string;
  content: string;
  isPinned: boolean;
  likes: string[];
  comments: PostComment[];
  createdAt: string;
  eventDate?: string;
  eventLocation?: string;
  pollQuestion?: string;
  pollOptions?: PollOption[];
  celebrationKind?: CelebrationKind;
  celebrationPerson?: string;
  celebrationDetail?: string;
}

export interface NewPost {
  type: PostType;
  content: string;
  eventDate?: string;
  eventLocation?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  celebrationKind?: string;
  celebrationPerson?: string;
  celebrationDetail?: string;
}

export interface CelebrationEntry {
  id: string;
  kind: CelebrationKind;
  name: string;
  personName: string;
  initials: string;
  personInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  detail: string;
}

export interface DirectoryEmployee {
  id: string;
  name: string;
  initials: string;
  jobTitle: string;
  department: string;
  email: string;
  location: string;
  skills: string[];
  employmentType: string;
  isOnLeave: boolean;
  startDate?: string;
}

