import { Users, UserRoundPlus, Home, Cake, UserMinus, CalendarCheck, HeartPulse, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ChartConfig } from "@/src/components/ui/chart";

interface RadialSeries {
  key: string;
  label: string;
  value: number;
  color: string;
}

export const STAT_CARDS: {
  label: string; link: string; icon: LucideIcon; value: string | number; sub: string; trend: string; up: boolean;
}[] = [
  { label: "Total Employees",       link: "/organization/employees",    icon: Users,         value: "183", sub: "Active headcount",             trend: "+8",  up: true  },
  { label: "New Hires (this month)", link: "/talent/onboarding",         icon: UserRoundPlus, value: "6",   sub: "Joined this month",            trend: "+3",  up: true  },
  { label: "Working from Home",      link: "/time-payroll/attendance",   icon: Home,          value: "24",  sub: "Remote today",                 trend: "+2",  up: true  },
  { label: "Upcoming Birthdays",     link: "/organization/employees",    icon: Cake,          value: "3",   sub: "Within next 7 days",           trend: "+1",  up: true  },
  { label: "Current Leavers",        link: "/time-payroll/leave",        icon: UserMinus,     value: "12",  sub: "Employees currently on leave", trend: "+4",  up: false },
  { label: "Annual Leave",           link: "/time-payroll/leave",        icon: CalendarCheck, value: "8",   sub: "Active annual leave requests", trend: "-1",  up: true  },
  { label: "Sick Leave",             link: "/time-payroll/leave",        icon: HeartPulse,    value: "3",   sub: "Active sick leave requests",   trend: "+1",  up: false },
  { label: "Other Leaves",           link: "/time-payroll/leave",        icon: CalendarDays,  value: "1",   sub: "Other active leave types",     trend: "0",   up: true  },
];

export const ATTENDANCE_DATA: { date: string; present: number; late: number; absent: number }[] = [
  { date: "Oct 01", present: 171, late: 8, absent: 4 },
  { date: "Oct 02", present: 169, late: 9, absent: 5 },
  { date: "Oct 03", present: 172, late: 6, absent: 5 },
  { date: "Oct 06", present: 174, late: 5, absent: 4 },
  { date: "Oct 07", present: 170, late: 10, absent: 3 },
  { date: "Oct 08", present: 168, late: 11, absent: 4 },
  { date: "Oct 09", present: 173, late: 7, absent: 3 },
  { date: "Oct 10", present: 175, late: 6, absent: 2 },
  { date: "Oct 13", present: 171, late: 8, absent: 4 },
  { date: "Oct 14", present: 172, late: 7, absent: 4 },
  { date: "Oct 15", present: 176, late: 4, absent: 3 },
  { date: "Oct 16", present: 174, late: 6, absent: 3 },
  { date: "Oct 17", present: 173, late: 7, absent: 3 },
  { date: "Oct 20", present: 170, late: 9, absent: 4 },
  { date: "Oct 21", present: 171, late: 8, absent: 4 },
  { date: "Oct 22", present: 169, late: 10, absent: 4 },
  { date: "Oct 23", present: 172, late: 7, absent: 4 },
  { date: "Oct 24", present: 174, late: 6, absent: 3 },
  { date: "Oct 27", present: 175, late: 5, absent: 3 },
  { date: "Oct 28", present: 173, late: 7, absent: 3 },
  { date: "Oct 29", present: 171, late: 8, absent: 4 },
  { date: "Oct 30", present: 172, late: 7, absent: 4 },
];

export const ATTENDANCE_CONFIG: ChartConfig = {
  present: { label: "Present",      color: "#4ED251" },
  late:    { label: "Late arrivals", color: "#ff8b2d" },
  absent:  { label: "Absent",        color: "var(--primary)" },
};

export const HEADCOUNT_DATA: { month: string; headcount: number }[] = [
  { month: "Jan", headcount: 160 },
  { month: "Feb", headcount: 163 },
  { month: "Mar", headcount: 165 },
  { month: "Apr", headcount: 168 },
  { month: "May", headcount: 170 },
  { month: "Jun", headcount: 172 },
  { month: "Jul", headcount: 175 },
  { month: "Aug", headcount: 177 },
  { month: "Sep", headcount: 180 },
  { month: "Oct", headcount: 183 },
];

export const HEADCOUNT_CONFIG: ChartConfig = {
  headcount: { label: "Headcount", color: "#4ED251" },
};

export const SALARY_DIST_DATA: { category: string; value: number }[] = [
  { category: "Engineering",    value: 48 },
  { category: "Sales",          value: 30 },
  { category: "Human Resources",value: 16 },
  { category: "Finance",        value: 22 },
  { category: "Marketing",      value: 18 },
  { category: "Operations",     value: 14 },
  { category: "Legal",          value: 10 },
  { category: "Product",        value: 25 },
];

export const SALARY_DIST_CONFIG: ChartConfig = {
  "Engineering":    { label: "Engineering",     color: "#4ED251" },
  "Sales":          { label: "Sales",           color: "#ff8b2d" },
  "Human Resources":{ label: "Human Resources", color: "var(--primary)" },
  "Finance":        { label: "Finance",         color: "#06b6d4" },
  "Marketing":      { label: "Marketing",       color: "#a78bfa" },
  "Operations":     { label: "Operations",      color: "#f59e0b" },
  "Legal":          { label: "Legal",           color: "#f43f5e" },
  "Product":        { label: "Product",         color: "#3b82f6" },
};

export const GENDER_SPLIT_SERIES: RadialSeries[] = [
  { key: "male",   label: "Male",   value: 108, color: "#4ED251" },
  { key: "female", label: "Female", value: 73,  color: "var(--primary)" },
  { key: "other",  label: "Other",  value: 2,   color: "#ff8b2d" },
];

export const GENDER_SPLIT_CONFIG: ChartConfig = {
  male:   { label: "Male",   color: "#4ED251" },
  female: { label: "Female", color: "var(--primary)" },
  other:  { label: "Other",  color: "#ff8b2d" },
};

export const CITIES: string[] = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu",
];

export const WORK_MODES_MAP: string[] = [
  "At Office", "Remotely", "Hybrid",
];

export const EMPLOYMENT_TYPE_DATA: { key: string; label: string; value: number; fill: string }[] = [
  { key: "full_time",  label: "Full-Time",  value: 128, fill: "#4ED251" },
  { key: "part_time",  label: "Part-Time",  value: 24,  fill: "#ff8b2d" },
  { key: "contract",   label: "Contract",   value: 18,  fill: "var(--primary)" },
  { key: "intern",     label: "Intern",     value: 13,  fill: "#06b6d4" },
];

export const EMPLOYMENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  full_time: { label: "Full-Time",  color: "#4ED251" },
  part_time: { label: "Part-Time",  color: "#ff8b2d" },
  contract:  { label: "Contract",   color: "var(--primary)" },
  intern:    { label: "Intern",     color: "#06b6d4" },
};

export const TOP_PERFORMERS: { id: string; name: string; role: string; workMode: string; rating: number }[] = [
  { id: "tp-001", name: "Adaeze Okonkwo",    role: "Lead Engineer",        workMode: "Hybrid",    rating: 98 },
  { id: "tp-002", name: "Chidinma Okeke",    role: "HR Manager",           workMode: "At Office", rating: 96 },
  { id: "tp-003", name: "Blessing Okafor",   role: "Finance Analyst",      workMode: "At Office", rating: 95 },
  { id: "tp-004", name: "Aisha Bello",       role: "Brand Manager",        workMode: "Hybrid",    rating: 93 },
  { id: "tp-005", name: "Chukwuemeka Eze",   role: "Backend Engineer",     workMode: "Remotely",  rating: 92 },
];
