import type {
  KudosPost,
  KudosLeaderboardEntry,
  KudosType,
  CompanyValue,
  ReactionType,
} from "@/src/lib/types/kudos";
import type { LucideIcon } from "lucide-react";
import {
  Handshake,
  Lightbulb,
  Crown,
  Star,
  Trophy,
  TrendingUp,
  Sparkles,
  Heart,
  Flame,
  ThumbsUp,
  Rocket,
  PartyPopper,
} from "lucide-react";

export const KUDOS_TYPE_CONFIG: Record<KudosType, { label: string; color: string; bg: string; border: string; gradient: string; icon: LucideIcon }> = {
  teamwork:       { label: "Teamwork",       color: "text-blue-700 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-950/60",      border: "border-blue-200 dark:border-blue-800",      gradient: "from-blue-500 to-blue-600",      icon: Handshake },
  innovation:     { label: "Innovation",     color: "text-violet-700 dark:text-violet-400",  bg: "bg-violet-100 dark:bg-violet-950/60",  border: "border-violet-200 dark:border-violet-800",  gradient: "from-violet-500 to-violet-600",  icon: Lightbulb },
  leadership:     { label: "Leadership",     color: "text-amber-700 dark:text-amber-400",    bg: "bg-amber-100 dark:bg-amber-950/60",    border: "border-amber-200 dark:border-amber-800",    gradient: "from-amber-500 to-amber-600",    icon: Crown },
  customer_focus: { label: "Customer Focus", color: "text-cyan-700 dark:text-cyan-400",      bg: "bg-cyan-100 dark:bg-cyan-950/60",      border: "border-cyan-200 dark:border-cyan-800",      gradient: "from-cyan-500 to-cyan-600",      icon: Star },
  excellence:     { label: "Excellence",     color: "text-emerald-700 dark:text-emerald-400",bg: "bg-emerald-100 dark:bg-emerald-950/60",border: "border-emerald-200 dark:border-emerald-800",gradient: "from-emerald-500 to-emerald-600",icon: Trophy },
  growth:         { label: "Growth",         color: "text-indigo-700 dark:text-indigo-400",  bg: "bg-indigo-100 dark:bg-indigo-950/60",  border: "border-indigo-200 dark:border-indigo-800",  gradient: "from-indigo-500 to-indigo-600",  icon: TrendingUp },
  custom:         { label: "Custom",         color: "text-rose-700 dark:text-rose-400",      bg: "bg-rose-100 dark:bg-rose-950/60",      border: "border-rose-200 dark:border-rose-800",      gradient: "from-rose-500 to-rose-600",      icon: Sparkles },
};

export const KUDOS_TYPE_OPTIONS: KudosType[] = Object.keys(KUDOS_TYPE_CONFIG) as KudosType[];

export const COMPANY_VALUE_CONFIG: Record<CompanyValue, { label: string; color: string; bg: string }> = {
  integrity:      { label: "Integrity",      color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/60" },
  innovation:     { label: "Innovation",     color: "text-violet-700 dark:text-violet-400",   bg: "bg-violet-100 dark:bg-violet-950/60" },
  collaboration:  { label: "Collaboration",  color: "text-blue-700 dark:text-blue-400",       bg: "bg-blue-100 dark:bg-blue-950/60" },
  excellence:     { label: "Excellence",     color: "text-amber-700 dark:text-amber-400",     bg: "bg-amber-100 dark:bg-amber-950/60" },
  customer_first: { label: "Customer First", color: "text-cyan-700 dark:text-cyan-400",       bg: "bg-cyan-100 dark:bg-cyan-950/60" },
};

export const REACTION_ICONS: Record<ReactionType, LucideIcon> = {
  heart:     Heart,
  fire:      Flame,
  clap:      ThumbsUp,
  star:      Star,
  rocket:    Rocket,
  celebrate: PartyPopper,
};

export const EMPLOYEE_ROSTER: { name: string; initials: string; department: string; dept: string }[] = [
  { name: "Emeka Nwosu",      initials: "EN", department: "Engineering",    dept: "Engineering" },
  { name: "Aisha Garba",      initials: "AG", department: "Legal",          dept: "Legal" },
  { name: "Chukwuebuka Obi",  initials: "CO", department: "Sales",          dept: "Sales" },
  { name: "Halima Musa",      initials: "HM", department: "Human Resources",dept: "Human Resources" },
  { name: "Tunde Badmus",     initials: "TB", department: "Engineering",    dept: "Engineering" },
  { name: "Ngozi Obi",        initials: "NO", department: "Finance",        dept: "Finance" },
  { name: "Babatunde Lawal",  initials: "BL", department: "Marketing",      dept: "Marketing" },
  { name: "Chiamaka Eze",     initials: "CE", department: "Operations",     dept: "Operations" },
  { name: "Adaeze Okonkwo",   initials: "AO", department: "Human Resources",dept: "Human Resources" },
];

export const KUDOS_POSTS: KudosPost[] = [
  {
    id: "kp-001", senderName: "Adaeze Okonkwo", senderInitials: "AO", senderDept: "Human Resources",
    recipientName: "Emeka Nwosu", recipientInitials: "EN", recipientDept: "Engineering",
    kudosType: "excellence", companyValue: "innovation",
    message: "Emeka delivered the new payroll integration feature two days early and with zero bugs. Outstanding work!",
    reactions: [
      { type: "fire",  count: 3, reactedBy: ["AO", "BL", "CO"], users: ["AO", "BL", "CO"] },
      { type: "clap",  count: 2, reactedBy: ["HM", "AG"],        users: ["HM", "AG"] },
    ],
    comments: [],
    createdAt: "2026-01-20T10:00:00Z", isPublic: true,
  },
  {
    id: "kp-002", senderName: "Tunde Badmus", senderInitials: "TB", senderDept: "Engineering",
    recipientName: "Halima Musa", recipientInitials: "HM", recipientDept: "Human Resources",
    kudosType: "teamwork", companyValue: "collaboration",
    message: "Halima went above and beyond helping our new hires settle in. She answered every question patiently.",
    reactions: [
      { type: "heart", count: 4, reactedBy: ["EN", "AG", "CE", "NO"], users: ["EN", "AG", "CE", "NO"] },
      { type: "star",  count: 1, reactedBy: ["AO"],                    users: ["AO"] },
    ],
    comments: [],
    createdAt: "2026-01-19T14:30:00Z", isPublic: true,
  },
  {
    id: "kp-003", senderName: "Babatunde Lawal", senderInitials: "BL", senderDept: "Marketing",
    recipientName: "Chukwuebuka Obi", recipientInitials: "CO", recipientDept: "Sales",
    kudosType: "customer_focus", companyValue: "customer_first",
    message: "Chukwuebuka closed the biggest deal of the quarter through sheer dedication and client focus. Incredible!",
    reactions: [
      { type: "rocket", count: 4, reactedBy: ["AO", "TB", "EN", "CE"], users: ["AO", "TB", "EN", "CE"] },
    ],
    comments: [],
    createdAt: "2026-01-18T09:00:00Z", isPublic: true,
  },
  {
    id: "kp-004", senderName: "Chiamaka Eze", senderInitials: "CE", senderDept: "Operations",
    recipientName: "Ngozi Obi", recipientInitials: "NO", recipientDept: "Finance",
    kudosType: "innovation", companyValue: "excellence",
    message: "Ngozi redesigned our expense approval workflow saving the team 3 hours per week.",
    reactions: [
      { type: "star", count: 2, reactedBy: ["BL", "HM"], users: ["BL", "HM"] },
      { type: "fire", count: 1, reactedBy: ["CO"],        users: ["CO"] },
    ],
    comments: [],
    createdAt: "2026-01-17T11:00:00Z", isPublic: true,
  },
  {
    id: "kp-005", senderName: "Ngozi Obi", senderInitials: "NO", senderDept: "Finance",
    recipientName: "Aisha Garba", recipientInitials: "AG", recipientDept: "Legal",
    kudosType: "leadership", companyValue: "integrity",
    message: "Aisha led the contract review process flawlessly and kept everyone aligned during a tight deadline.",
    reactions: [
      { type: "clap", count: 3, reactedBy: ["CE", "TB", "AO"], users: ["CE", "TB", "AO"] },
    ],
    comments: [],
    createdAt: "2026-01-15T16:00:00Z", isPublic: true,
  },
];

export const LEADERBOARD: KudosLeaderboardEntry[] = [
  { id: "lb-001", employeeName: "Emeka Nwosu",      employeeInitials: "EN", rank: 1, name: "Emeka Nwosu",      initials: "EN", department: "Engineering",    dept: "Engineering",    kudosReceived: 14, kudosSent: 8,  streak: 4 },
  { id: "lb-002", employeeName: "Halima Musa",      employeeInitials: "HM", rank: 2, name: "Halima Musa",      initials: "HM", department: "Human Resources",dept: "Human Resources",kudosReceived: 12, kudosSent: 10, streak: 3 },
  { id: "lb-003", employeeName: "Chukwuebuka Obi",  employeeInitials: "CO", rank: 3, name: "Chukwuebuka Obi",  initials: "CO", department: "Sales",          dept: "Sales",          kudosReceived: 11, kudosSent: 6,  streak: 2 },
  { id: "lb-004", employeeName: "Ngozi Obi",        employeeInitials: "NO", rank: 4, name: "Ngozi Obi",        initials: "NO", department: "Finance",        dept: "Finance",        kudosReceived: 9,  kudosSent: 11, streak: 3 },
  { id: "lb-005", employeeName: "Aisha Garba",      employeeInitials: "AG", rank: 5, name: "Aisha Garba",      initials: "AG", department: "Legal",          dept: "Legal",          kudosReceived: 8,  kudosSent: 7,  streak: 1 },
  { id: "lb-006", employeeName: "Babatunde Lawal",  employeeInitials: "BL", rank: 6, name: "Babatunde Lawal",  initials: "BL", department: "Marketing",      dept: "Marketing",      kudosReceived: 7,  kudosSent: 9,  streak: 2 },
  { id: "lb-007", employeeName: "Tunde Badmus",     employeeInitials: "TB", rank: 7, name: "Tunde Badmus",     initials: "TB", department: "Engineering",    dept: "Engineering",    kudosReceived: 6,  kudosSent: 5,  streak: 1 },
  { id: "lb-008", employeeName: "Chiamaka Eze",     employeeInitials: "CE", rank: 8, name: "Chiamaka Eze",     initials: "CE", department: "Operations",     dept: "Operations",     kudosReceived: 5,  kudosSent: 12, streak: 4 },
  { id: "lb-009", employeeName: "Adaeze Okonkwo",   employeeInitials: "AO", rank: 9, name: "Adaeze Okonkwo",   initials: "AO", department: "Human Resources",dept: "Human Resources",kudosReceived: 4,  kudosSent: 14, streak: 5 },
];
