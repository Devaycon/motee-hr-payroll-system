import {
  CalendarDays,
  Clock,
  BookOpen,
  ClipboardList,
  CheckSquare,
  FileText,
  Star,
  Award,
  TrendingUp,
  LifeBuoy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const EMPLOYEE_LEAVE_BALANCES: {
  id: string;
  type: string;
  total: number;
  used: number;
  pending: number;
  color: string;
  bgColor: string;
}[] = [
  { id: "elb-001", type: "Annual",       total: 20, used: 8,  pending: 0, color: "text-blue-600",    bgColor: "bg-blue-500/10" },
  { id: "elb-002", type: "Sick",         total: 10, used: 2,  pending: 0, color: "text-rose-600",    bgColor: "bg-rose-500/10" },
  { id: "elb-003", type: "Study",        total: 5,  used: 0,  pending: 0, color: "text-teal-600",    bgColor: "bg-teal-500/10" },
  { id: "elb-004", type: "Compassionate",total: 3,  used: 0,  pending: 0, color: "text-amber-600",   bgColor: "bg-amber-500/10" },
];

export const EMPLOYEE_PENDING_ITEMS: {
  id: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  link: string;
  urgent: boolean;
}[] = [
  { id: "epi-001", icon: CalendarDays, label: "Leave Request Pending",    sub: "Annual leave — Apr 14–18",      link: "/time-off/balance",    urgent: false },
  { id: "epi-002", icon: BookOpen,     label: "Overdue Course",           sub: "AML Compliance Training",       link: "/growth/training",     urgent: true  },
  { id: "epi-003", icon: ClipboardList,label: "Self-Assessment Due",      sub: "Q1 Performance Review",         link: "/growth/performance",  urgent: true  },
  { id: "epi-004", icon: FileText,     label: "Policy Acknowledgement",   sub: "Remote Work Policy (Updated)",  link: "/profile/documents",   urgent: false },
];

export const EMPLOYEE_TASKS: {
  id: string;
  label: string;
  done: boolean;
  priority: string;
  due: string;
  link: string;
  category: string;
  notes?: string;
}[] = [
  { id: "et-001", label: "Complete AML compliance training",        done: false, priority: "high",   due: "2026-04-22", link: "/growth/training",     category: "Training",    notes: "Deadline extended. Video + quiz required." },
  { id: "et-002", label: "Submit Q1 self-assessment",               done: false, priority: "high",   due: "2026-04-26", link: "/growth/performance", category: "Performance", notes: "Review your goals before submitting." },
  { id: "et-003", label: "Acknowledge remote work policy",          done: false, priority: "medium", due: "2026-04-30", link: "/profile/documents",  category: "HR",          notes: "Policy updated March 2026." },
  { id: "et-004", label: "Update emergency contact details",        done: true,  priority: "low",    due: "2026-04-20", link: "/profile/my-profile", category: "Personal" },
  { id: "et-005", label: "Review onboarding checklist items",       done: false, priority: "medium", due: "2026-05-01", link: "/growth/training",     category: "HR" },
  { id: "et-006", label: "Request document from HR (offer letter)", done: false, priority: "low",    due: "2026-05-05", link: "/company/helpdesk",    category: "Personal" },
];

export const EMPLOYEE_UPCOMING_EVENTS: {
  id: number;
  icon: LucideIcon;
  label: string;
  date: string;
  isoDate: string;
  type: string;
}[] = [
  { id: 1,  icon: CalendarDays, label: "Employee Wellbeing Workshop",      date: "Apr 24, 2026", isoDate: "2026-04-24", type: "company"     },
  { id: 2,  icon: CalendarDays, label: "Q2 All-Hands Meeting",             date: "Apr 25, 2026", isoDate: "2026-04-25", type: "company"     },
  { id: 3,  icon: BookOpen,     label: "AML Compliance Training Deadline", date: "Apr 25, 2026", isoDate: "2026-04-25", type: "training"    },
  { id: 4,  icon: Star,         label: "Blessing Okafor's Birthday",       date: "Apr 27, 2026", isoDate: "2026-04-27", type: "birthday"    },
  { id: 5,  icon: CalendarDays, label: "Annual Leave — Chukwuemeka Eze",   date: "Apr 28, 2026", isoDate: "2026-04-28", type: "leave"       },
  { id: 6,  icon: Award,        label: "Emeka Nwosu — 3yr Anniversary",    date: "Apr 30, 2026", isoDate: "2026-04-30", type: "anniversary" },
  { id: 7,  icon: BookOpen,     label: "Team Learning Day",                date: "May 2, 2026",  isoDate: "2026-05-02", type: "training"    },
  { id: 8,  icon: CalendarDays, label: "New Hire Orientation",             date: "May 5, 2026",  isoDate: "2026-05-05", type: "company"     },
  { id: 9,  icon: Star,         label: "Halima Musa's Birthday",           date: "May 8, 2026",  isoDate: "2026-05-08", type: "birthday"    },
  { id: 10, icon: TrendingUp,   label: "Q2 Performance Check-in",          date: "May 15, 2026", isoDate: "2026-05-15", type: "performance" },
];

export const EMPLOYEE_RECENT_KUDOS: {
  id: string;
  senderName: string;
  senderInitials: string;
  kudosType: string;
  emoji: string;
  message: string;
  time: string;
}[] = [
  {
    id: "erk-001",
    senderName: "Adaeze Okonkwo",
    senderInitials: "AO",
    kudosType: "Excellence",
    emoji: "🏆",
    message: "Outstanding delivery on the payroll integration — zero bugs and two days early!",
    time: "2 days ago",
  },
  {
    id: "erk-002",
    senderName: "Tunde Badmus",
    senderInitials: "TB",
    kudosType: "Teamwork",
    emoji: "🤝",
    message: "Thank you for jumping in and helping the team during the product launch crunch.",
    time: "5 days ago",
  },
  {
    id: "erk-003",
    senderName: "Babatunde Lawal",
    senderInitials: "BL",
    kudosType: "Innovation",
    emoji: "💡",
    message: "Great initiative proposing the new onboarding automation — it saved us 3 hours a week.",
    time: "1 week ago",
  },
];

export const TEAM_ON_LEAVE: {
  id: string;
  name: string;
  initials: string;
  leaveType: string;
  returnDate: string;
}[] = [
  { id: "tol-001", name: "Chukwuemeka Eze",  initials: "CE", leaveType: "Annual",     returnDate: "Apr 25" },
  { id: "tol-002", name: "Aisha Bello",       initials: "AB", leaveType: "Sick",       returnDate: "Apr 24" },
];

export const EMPLOYEE_RECENT_ACTIVITY: {
  id: number;
  icon: LucideIcon;
  action: string;
  time: string;
}[] = [
  { id: 1, icon: CalendarDays, action: "You submitted a leave request for Apr 14–18 (Annual)",    time: "2 days ago"  },
  { id: 2, icon: CheckSquare,  action: "Self-assessment for Q1 review cycle opened",               time: "3 days ago"  },
  { id: 3, icon: BookOpen,     action: "You enrolled in 'Advanced Excel for Finance' course",      time: "1 week ago"  },
  { id: 4, icon: Award,        action: "You received a kudos from Adaeze Okonkwo",                 time: "1 week ago"  },
  { id: 5, icon: FileText,     action: "Payslip for March 2026 is now available",                  time: "2 weeks ago" },
];

export const EMPLOYEE_QUICK_LINKS: {
  id: string;
  icon: LucideIcon;
  label: string;
  link: string;
  color: string;
  bg: string;
}[] = [
  { id: "eql-001", icon: CalendarDays, label: "Request Leave",     link: "/time-off/request",     color: "text-blue-600",   bg: "bg-blue-500/10"   },
  { id: "eql-002", icon: Clock,        label: "Attendance",        link: "/time-off/attendance",  color: "text-violet-600", bg: "bg-violet-500/10" },
  { id: "eql-003", icon: FileText,     label: "My Payslips",       link: "/profile/payslips",     color: "text-emerald-600",bg: "bg-emerald-500/10"},
  { id: "eql-004", icon: TrendingUp,   label: "Performance",       link: "/growth/performance",   color: "text-amber-600",  bg: "bg-amber-500/10"  },
  { id: "eql-005", icon: BookOpen,     label: "My Courses",        link: "/growth/training",      color: "text-teal-600",   bg: "bg-teal-500/10"   },
  { id: "eql-006", icon: LifeBuoy,     label: "HR Help Desk",      link: "/company/helpdesk",     color: "text-rose-600",   bg: "bg-rose-500/10"   },
];

export const DAY_AT_A_GLANCE: {
  clockedIn: boolean;
  clockInTime: string | null;
  hoursWorked: string;
  leaveToday: string | null;
  pendingActions: number;
  tasksDueToday: number;
} = {
  clockedIn: true,
  clockInTime: "8:54 AM",
  hoursWorked: "4h 12m",
  leaveToday: null,
  pendingActions: 4,
  tasksDueToday: 2,
};

export const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
