import type { Position, PositionStatus } from "@/src/lib/types/roles";

export const STATUS_LABELS: Record<PositionStatus, string> = {
  active: "Active",
  vacant: "Vacant",
  inactive: "Inactive",
  filled: "Filled",
};

export const STATUS_STYLES: Record<PositionStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  vacant: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  filled: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Product",
  "Sales",
  "Operations",
  "Legal",
];

export const GRADE_OPTIONS = [
  "L1", "L2", "L3", "L4", "L5",
  "M1", "M2", "M3",
  "S1", "S2",
];

export const POSITIONS: Position[] = [
  {
    id: "pos-001",
    title: "Senior Software Engineer",
    department: "Engineering",
    grade: "L4",
    status: "active",
    description: "Responsible for designing and building scalable backend services.",
    createdAt: "2023-02-01",
  },
  {
    id: "pos-002",
    title: "HR Business Partner",
    department: "Human Resources",
    grade: "M2",
    status: "active",
    description: "Partners with department heads on talent and workforce strategy.",
    createdAt: "2023-02-10",
  },
  {
    id: "pos-003",
    title: "Financial Analyst",
    department: "Finance",
    grade: "L3",
    status: "vacant",
    description: "Conducts financial modelling and budget analysis.",
    createdAt: "2023-03-05",
  },
  {
    id: "pos-004",
    title: "Product Manager",
    department: "Product",
    grade: "M1",
    status: "active",
    description: "Defines product roadmap and coordinates cross-functional delivery.",
    createdAt: "2023-03-20",
  },
  {
    id: "pos-005",
    title: "Sales Executive",
    department: "Sales",
    grade: "L2",
    status: "active",
    description: "Drives new business acquisition and manages client relationships.",
    createdAt: "2023-04-01",
  },
  {
    id: "pos-006",
    title: "DevOps Engineer",
    department: "Engineering",
    grade: "L3",
    status: "vacant",
    description: "Manages CI/CD pipelines and cloud infrastructure reliability.",
    createdAt: "2023-04-15",
  },
  {
    id: "pos-007",
    title: "Marketing Specialist",
    department: "Marketing",
    grade: "L2",
    status: "inactive",
    description: "Executes digital campaigns and manages brand communications.",
    createdAt: "2023-05-01",
  },
  {
    id: "pos-008",
    title: "Operations Coordinator",
    department: "Operations",
    grade: "L2",
    status: "active",
    description: "Supports daily operational processes and logistics planning.",
    createdAt: "2023-05-15",
  },
];
