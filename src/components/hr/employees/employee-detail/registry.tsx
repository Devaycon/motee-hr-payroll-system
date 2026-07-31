"use client";

import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  User,
  Phone,
  CalendarClock,
  Plane,
  Thermometer,
  Clock,
  MapPin,
  TrendingUp,
  BookOpen,
  GraduationCap,
  MonitorPlay,
  Award,
  Briefcase,
  Banknote,
  Package,
  FileText,
  ShieldCheck,
  ClipboardList,
  History,
  KeyRound,
  Gavel,
  Scale,
  HeartPulse,
  StickyNote,
  BriefcaseBusiness,
  Coins,
  DoorOpen,
  Settings2,
  Lock,
  ScrollText,
  Receipt,
  Network,
  FileClock,
  Milestone,
} from "lucide-react";
import { useCan } from "@/src/lib/permissions/use-can";
import * as Mod from "./modules";
import type { ModuleProps } from "./modules";
import { EmployeeDocumentsModule } from "./employee-documents";
import { ContractsModule } from "./contracts-module";
import { TeamModule } from "./team-module";
import { ChangeLogModule } from "./change-log-module";
import { TimelineModule } from "./timeline-module";

export interface ModuleEntry {
  key: string;
  label: string;
  group: string;
  icon: LucideIcon;
  permission?: string;
  Component: ComponentType<ModuleProps>;
}

export const MODULE_GROUP_ORDER = [
  "Profile",
  "Time & Attendance",
  "Growth",
  "Assets",
  "Compliance",
  "HR Admin",
];

export const EMPLOYEE_MODULES: ModuleEntry[] = [
  { key: "profile", label: "Profile", group: "Profile", icon: User, Component: Mod.ProfileModule },
  // First in the nav, so the file opens on the journey overview rather than a
  // single record — it is the only view that spans every other module.
  { key: "timeline", label: "Timeline", group: "Profile", icon: Milestone, Component: TimelineModule },
  { key: "job", label: "Job", group: "Profile", icon: BriefcaseBusiness, Component: Mod.JobModule },
  { key: "compensation", label: "Compensation", group: "Profile", icon: Coins, Component: Mod.CompensationModule },
  { key: "payslips", label: "Payslips", group: "Profile", icon: Banknote, Component: Mod.PayslipsModule },
  { key: "preferences", label: "Preferences", group: "Profile", icon: Settings2, Component: Mod.PreferencesModule },
  { key: "documents", label: "Employee Documents", group: "Profile", icon: FileText, Component: EmployeeDocumentsModule },
  { key: "contracts", label: "Contracts", group: "Profile", icon: ScrollText, Component: ContractsModule },
  { key: "emergency", label: "Emergency Contact", group: "Profile", icon: Phone, Component: Mod.EmergencyContactModule },
  { key: "team", label: "Team & Structure", group: "Profile", icon: Network, Component: TeamModule },

  { key: "work-pattern", label: "Work Pattern", group: "Time & Attendance", icon: CalendarClock, Component: Mod.WorkPatternModule },
  { key: "leave", label: "Leave", group: "Time & Attendance", icon: Plane, Component: Mod.LeaveModule },
  { key: "sickness", label: "Sickness", group: "Time & Attendance", icon: Thermometer, Component: Mod.SicknessModule },
  { key: "time-logs", label: "Time Logs", group: "Time & Attendance", icon: Clock, Component: Mod.TimeLogsModule },
  { key: "bookings", label: "Location Bookings", group: "Time & Attendance", icon: MapPin, Component: Mod.BookingsModule },
  { key: "expenses", label: "Expenses", group: "Time & Attendance", icon: Receipt, Component: Mod.ExpensesModule },

  { key: "performance", label: "Performance", group: "Growth", icon: TrendingUp, Component: Mod.PerformanceModule },
  { key: "learn", label: "Learning", group: "Growth", icon: BookOpen, Component: Mod.LearnModule },
  { key: "training-videos", label: "Training", group: "Growth", icon: MonitorPlay, Component: Mod.TrainingDashboardModule },
  { key: "training", label: "Certifications", group: "Growth", icon: GraduationCap, Component: Mod.TrainingModule },
  { key: "kudos", label: "Kudos", group: "Growth", icon: Award, Component: Mod.KudosModule },
  { key: "jobs", label: "Internal Moves", group: "Growth", icon: Briefcase, Component: Mod.JobsModule },

  
  { key: "assets", label: "Assigned Assets", group: "Assets", icon: Package, Component: Mod.AssetsModule },

  { key: "dbs", label: "DBS / Background", group: "Compliance", icon: ShieldCheck, Component: Mod.DbsModule },

  { key: "change-log", label: "Profile Change Request Log", group: "HR Admin", icon: FileClock, Component: ChangeLogModule },
  { key: "tasks", label: "Tasks", group: "HR Admin", icon: ClipboardList, Component: Mod.TasksModule },
  { key: "offboarding", label: "Offboarding", group: "HR Admin", icon: DoorOpen, Component: Mod.OffboardingModule },
  { key: "access", label: "Access", group: "HR Admin", icon: Lock, Component: Mod.AccessModule },
  { key: "history", label: "History", group: "HR Admin", icon: History, Component: Mod.HistoryModule },
  { key: "permissions", label: "Permissions", group: "HR Admin", icon: KeyRound, Component: Mod.PermissionsModule },
  { key: "disciplinaries", label: "Disciplinaries", group: "HR Admin", icon: Gavel, permission: "employee.disciplinary", Component: Mod.DisciplinariesModule },
  { key: "grievances", label: "Grievances", group: "HR Admin", icon: Scale, permission: "employee.grievances", Component: Mod.GrievancesModule },
  { key: "medical", label: "Medical Facts", group: "HR Admin", icon: HeartPulse, permission: "employee.medical", Component: Mod.MedicalModule },
  { key: "notes", label: "Notes & Reminders", group: "HR Admin", icon: StickyNote, permission: "employee.notes", Component: Mod.NotesModule },
];

/**
 * Modules surfaced on the self "My Profile" page (curated self-service set).
 * Excludes admin/system modules (tasks, history, permissions, offboarding,
 * access) and the permission-gated ones (disciplinaries, grievances, medical,
 * notes). `profile` is rendered at the top of the page, not in the nav.
 */
export const SELF_PROFILE_MODULE_KEYS = new Set<string>([
  "timeline",
  "job",
  "preferences",
  "documents",
  "contracts",
  "emergency",
  "team",
  "work-pattern",
  "leave",
  "sickness",
  "time-logs",
  "bookings",
  "expenses",
  "performance",
  "learn",
  "training-videos",
  "training",
  "kudos",
  "jobs",
  "pay",
  "compensation",
  "payslips",
  "assets",
  "dbs",
  "tasks",
  // Employees can follow their own change requests through to a decision.
  "change-log",
]);

/** Modules the current viewer is allowed to see (sensitive ones gated). */
export function useVisibleEmployeeModules(): ModuleEntry[] {
  const can: Record<string, boolean> = {
    "employee.medical": useCan("employee.medical", "view"),
    "employee.disciplinary": useCan("employee.disciplinary", "view"),
    "employee.grievances": useCan("employee.grievances", "view"),
    "employee.notes": useCan("employee.notes", "view"),
  };
  return EMPLOYEE_MODULES.filter((m) => !m.permission || can[m.permission]);
}
