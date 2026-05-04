import type {
  CommunityPost,
  CelebrationEntry,
  DirectoryEmployee,
} from "@/src/lib/types/community";

export function computeFeedStats(posts: CommunityPost[]): {
  totalPosts: number;
  totalLikes: number;
  totalPollVotes: number;
} {
  return {
    totalPosts: posts.length,
    totalLikes: posts.reduce((s, p) => s + p.likes.length, 0),
    totalPollVotes: posts.reduce((s, p) => s + (p.pollOptions?.reduce((sv, o) => sv + o.votes.length, 0) ?? 0), 0),
  };
}

export const POSTS: CommunityPost[] = [
  {
    id: "post-001", type: "update", authorName: "Adaeze Okonkwo", authorInitials: "AO", authorDept: "Human Resources", content: "Exciting news! Our Q1 2026 All-Hands meeting is scheduled for February 14th. All staff are required to attend in person or via the live stream. Details will follow by email.", isPinned: true, likes: ["EN", "HM", "CO", "TB", "BL"], comments: [
      { id: "c-001", authorName: "Emeka Nwosu", authorInitials: "EN", authorDept: "Engineering", message: "Looking forward to it!", createdAt: "2026-01-18T10:05:00Z" },
    ], createdAt: "2026-01-18T10:00:00Z",
  },
  {
    id: "post-002", type: "shoutout", authorName: "Babatunde Lawal", authorInitials: "BL", authorDept: "Marketing", content: "Big shoutout to the Engineering team for shipping the new payroll module ahead of schedule! You all crushed it!", isPinned: false, likes: ["AO", "CO", "CE", "NO", "AG"], comments: [
      { id: "c-002", authorName: "Emeka Nwosu", authorInitials: "EN", authorDept: "Engineering", message: "Team effort all the way!", createdAt: "2026-01-17T09:05:00Z" },
      { id: "c-003", authorName: "Adaeze Okonkwo", authorInitials: "AO", authorDept: "Human Resources", message: "Well deserved recognition!", createdAt: "2026-01-17T09:30:00Z" },
    ], createdAt: "2026-01-17T09:00:00Z",
  },
  {
    id: "post-003", type: "poll", authorName: "Chiamaka Eze", authorInitials: "CE", authorDept: "Operations", content: "Team lunch poll! Where should we go for the Q1 team outing?", isPinned: false, likes: ["HM", "TB"], comments: [], createdAt: "2026-01-16T12:00:00Z", pollQuestion: "Where should we have the Q1 team outing?", pollOptions: [
      { id: "po-001", label: "Beach Resort", votes: ["AO", "EN", "CO"] },
      { id: "po-002", label: "Rooftop Restaurant", votes: ["HM", "BL", "TB"] },
      { id: "po-003", label: "Escape Room", votes: ["AG", "NO"] },
    ],
  },
  {
    id: "post-004", type: "event", authorName: "Halima Musa", authorInitials: "HM", authorDept: "Human Resources", content: "Join us for the Employee Wellbeing Workshop this Friday. Learn practical stress management and mindfulness techniques.", isPinned: false, likes: ["AO", "CE", "NO"], comments: [], createdAt: "2026-01-15T08:00:00Z", eventDate: "2026-01-24", eventLocation: "Conference Room B, Floor 3",
  },
  {
    id: "post-005", type: "milestone", authorName: "Ngozi Obi", authorInitials: "NO", authorDept: "Finance", content: "We just processed our 10,000th payroll run! A massive milestone for the Finance and HR teams. Thank you everyone.", isPinned: false, likes: ["AO", "HM", "BL", "TB", "CO", "EN"], comments: [
      { id: "c-004", authorName: "Chiamaka Eze", authorInitials: "CE", authorDept: "Operations", message: "Incredible achievement!", createdAt: "2026-01-14T15:05:00Z" },
    ], createdAt: "2026-01-14T15:00:00Z",
  },
];

export const CELEBRATIONS: CelebrationEntry[] = [
  { id: "cel-001", kind: "birthday",    name: "Emeka Nwosu",      personName: "Emeka Nwosu",      initials: "EN", personInitials: "EN", jobTitle: "Mobile Engineer",            department: "Engineering",    date: "2026-01-22", detail: "Happy Birthday!" },
  { id: "cel-002", kind: "anniversary", name: "Adaeze Okonkwo",   personName: "Adaeze Okonkwo",   initials: "AO", personInitials: "AO", jobTitle: "HR Manager",                 department: "Human Resources",date: "2026-01-25", detail: "3 Years with Motee" },
  { id: "cel-003", kind: "new_hire",    name: "Funmi Adeyemi",     personName: "Funmi Adeyemi",    initials: "FA", personInitials: "FA", jobTitle: "Product Designer",           department: "Product",        date: "2026-01-27", detail: "Welcome to the team!" },
  { id: "cel-004", kind: "promotion",   name: "Chukwuebuka Obi",   personName: "Chukwuebuka Obi",  initials: "CO", personInitials: "CO", jobTitle: "Senior Sales Executive",     department: "Sales",          date: "2026-01-28", detail: "Promoted to Senior Sales Executive" },
  { id: "cel-005", kind: "birthday",    name: "Halima Musa",       personName: "Halima Musa",      initials: "HM", personInitials: "HM", jobTitle: "HR Business Partner",        department: "Human Resources",date: "2026-02-02", detail: "Happy Birthday!" },
  { id: "cel-006", kind: "anniversary", name: "Tunde Badmus",      personName: "Tunde Badmus",     initials: "TB", personInitials: "TB", jobTitle: "Senior Software Engineer",   department: "Engineering",    date: "2026-02-05", detail: "5 Years with Motee" },
];

export const DIRECTORY_EMPLOYEES: DirectoryEmployee[] = [
  { id: "de-001", name: "Emeka Nwosu",      initials: "EN", jobTitle: "Mobile Engineer",     department: "Engineering",    email: "emeka.nwosu@motee.ng",      location: "Lagos",  skills: ["React Native", "TypeScript", "Node.js"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-002", name: "Aisha Garba",      initials: "AG", jobTitle: "Legal Counsel",        department: "Legal",          email: "aisha.garba@motee.ng",      location: "Abuja",  skills: ["Contract Law", "Compliance", "Negotiation"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-003", name: "Chukwuebuka Obi",  initials: "CO", jobTitle: "Sales Executive",      department: "Sales",          email: "chukwuebuka.obi@motee.ng",  location: "Lagos",  skills: ["B2B Sales", "CRM", "Negotiation"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-004", name: "Halima Musa",       initials: "HM", jobTitle: "HR Generalist",        department: "Human Resources",email: "halima.musa@motee.ng",       location: "Abuja",  skills: ["Recruitment", "Onboarding", "HRIS"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-005", name: "Tunde Badmus",      initials: "TB", jobTitle: "Backend Engineer",     department: "Engineering",    email: "tunde.badmus@motee.ng",     location: "Lagos",  skills: ["Node.js", "PostgreSQL", "Docker"], employmentType: "Full-Time", isOnLeave: true },
  { id: "de-006", name: "Ngozi Obi",         initials: "NO", jobTitle: "Financial Analyst",    department: "Finance",        email: "ngozi.obi@motee.ng",        location: "Lagos",  skills: ["Excel", "Power BI", "Financial Modelling"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-007", name: "Babatunde Lawal",   initials: "BL", jobTitle: "Marketing Manager",    department: "Marketing",      email: "babatunde.lawal@motee.ng",  location: "Lagos",  skills: ["Brand Strategy", "Content", "SEO"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-008", name: "Chiamaka Eze",      initials: "CE", jobTitle: "Operations Lead",      department: "Operations",     email: "chiamaka.eze@motee.ng",     location: "Port Harcourt", skills: ["Process Design", "Lean", "Project Management"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-009", name: "Adaeze Okonkwo",    initials: "AO", jobTitle: "HR Director",          department: "Human Resources",email: "adaeze.okonkwo@motee.ng",   location: "Lagos",  skills: ["HR Strategy", "Talent Management", "Labour Law"], employmentType: "Full-Time", isOnLeave: false },
  { id: "de-010", name: "Funmi Adeyemi",     initials: "FA", jobTitle: "Product Designer",     department: "Product",        email: "funmi.adeyemi@motee.ng",    location: "Lagos",  skills: ["Figma", "UX Research", "Prototyping"], employmentType: "Full-Time", isOnLeave: false },
];

import type { CelebrationKind, PostType } from "@/src/lib/types/community";

export const CELEBRATION_KIND_CONFIG: Record<CelebrationKind, { label: string; color: string; bg: string; border: string; icon: string; emoji: string }> = {
  birthday:    { label: "Birthday",         color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40",   border: "border-amber-200 dark:border-amber-800",   icon: "🎂", emoji: "🎂" },
  anniversary: { label: "Work Anniversary", color: "text-violet-700 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200 dark:border-violet-800", icon: "🎉", emoji: "🎉" },
  new_hire:    { label: "New Hire",         color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", icon: "👋", emoji: "👋" },
  promotion:   { label: "Promotion",        color: "text-blue-700 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-950/40",      border: "border-blue-200 dark:border-blue-800",      icon: "🚀", emoji: "🚀" },
};
export const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; bg: string; border: string }> = {
  update:    { label: "Update",    color: "text-blue-700 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-950/40",      border: "border-blue-200 dark:border-blue-800" },
  shoutout:  { label: "Shoutout", color: "text-amber-700 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-950/40",    border: "border-amber-200 dark:border-amber-800" },
  event:     { label: "Event",    color: "text-violet-700 dark:text-violet-400",  bg: "bg-violet-50 dark:bg-violet-950/40",  border: "border-violet-200 dark:border-violet-800" },
  poll:      { label: "Poll",     color: "text-emerald-700 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-950/40",border: "border-emerald-200 dark:border-emerald-800" },
  milestone: { label: "Milestone",color: "text-rose-700 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-950/40",      border: "border-rose-200 dark:border-rose-800" },
};

export const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = Object.entries(POST_TYPE_CONFIG).map(([value, cfg]) => ({ value: value as PostType, label: cfg.label }));

export const DEPARTMENT_CONFIG: Record<string, { label: string }> = {
  "Engineering":    { label: "Engineering" },
  "Human Resources":{ label: "Human Resources" },
  "Finance":        { label: "Finance" },
  "Marketing":      { label: "Marketing" },
  "Product":        { label: "Product" },
  "Sales":          { label: "Sales" },
  "Operations":     { label: "Operations" },
  "Legal":          { label: "Legal" },
};

export const DIRECTORY_DEPARTMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Departments" },
  ...Object.entries(DEPARTMENT_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
];
