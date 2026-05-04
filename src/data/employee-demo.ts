import type { MyProfile, Payslip, LeaveBalance, MyAsset } from "@/src/lib/types/employee.types";

export const DEMO_MY_PROFILE: MyProfile = {
  id: "e-021",
  name: "James Adeyemi",
  email: "james.adeyemi@company.ng",
  phone: "+234-801-000-0001",
  department: "Engineering",
  jobTitle: "Software Engineer",
  employmentType: "full_time",
  status: "active",
  startDate: "2022-03-15",
  avatar: null,
  salary: 450000,
  managerId: "e-001",
  emergencyContact: {
    name: "Mrs. Funmilayo Adeyemi",
    relationship: "Mother",
    phone: "+234-802-111-2222",
  },
  bankAccount: {
    bankName: "Zenith Bank",
    accountNumber: "2012345678",
    accountName: "James Adeyemi",
  },
  address: {
    street: "14 Adeola Odeku Street",
    city: "Victoria Island",
    state: "Lagos",
    country: "Nigeria",
    postalCode: "101241",
  },
};

export const DEMO_MY_PAYSLIPS: Payslip[] = [
  {
    id: "ps-001",
    period: "October 2025",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2025-10-28",
    downloadUrl: "/payslips/oct-2025.pdf",
  },
  {
    id: "ps-002",
    period: "November 2025",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2025-11-28",
    downloadUrl: "/payslips/nov-2025.pdf",
  },
  {
    id: "ps-003",
    period: "December 2025",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2025-12-24",
    downloadUrl: "/payslips/dec-2025.pdf",
  },
  {
    id: "ps-004",
    period: "January 2026",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2026-01-28",
    downloadUrl: "/payslips/jan-2026.pdf",
  },
  {
    id: "ps-005",
    period: "February 2026",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2026-02-26",
    downloadUrl: "/payslips/feb-2026.pdf",
  },
  {
    id: "ps-006",
    period: "March 2026",
    gross: 450000,
    deductions: 98750,
    net: 351250,
    paidDate: "2026-03-28",
    downloadUrl: "/payslips/mar-2026.pdf",
  },
];

export const DEMO_MY_LEAVE_BALANCES: LeaveBalance[] = [
  { type: "annual", total: 20, used: 6, remaining: 14 },
  { type: "sick", total: 10, used: 0, remaining: 10 },
  { type: "maternity", total: 90, used: 0, remaining: 90 },
  { type: "paternity", total: 14, used: 0, remaining: 14 },
  { type: "compassionate", total: 5, used: 0, remaining: 5 },
];

export const DEMO_MY_ASSETS: MyAsset[] = [
  {
    id: "ast-001",
    name: "MacBook Pro 14-inch (M3)",
    type: "Laptop",
    serialNumber: "C02XG2JFHV2Q",
    assignedDate: "2022-03-15",
    condition: "good",
  },
  {
    id: "ast-002",
    name: "Security Access Card",
    type: "Access Card",
    serialNumber: "SAC-00421",
    assignedDate: "2022-03-15",
    condition: "excellent",
  },
];

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  status: "on_track" | "behind" | "completed";
}

export interface PerformanceCycle {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  overallRating: number | null;
  goals: PerformanceGoal[];
}

export const DEMO_MY_PERFORMANCE: PerformanceCycle = {
  id: "pc-001",
  period: "Q1 2026",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  overallRating: null,
  goals: [
    {
      id: "g-001",
      title: "Deliver Payment Microservice v2",
      description: "Complete full refactor of the payments service with improved test coverage (>80%)",
      dueDate: "2026-03-15",
      progress: 85,
      status: "on_track",
    },
    {
      id: "g-002",
      title: "Complete AWS Solutions Architect Certification",
      description: "Study and pass the AWS SAA-C03 exam before end of quarter",
      dueDate: "2026-03-31",
      progress: 40,
      status: "behind",
    },
    {
      id: "g-003",
      title: "Mentor two junior engineers",
      description: "Conduct bi-weekly 1:1 sessions and code reviews for two junior engineers",
      dueDate: "2026-03-31",
      progress: 70,
      status: "on_track",
    },
  ],
};

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  author: string;
  isRead: boolean;
}

export const DEMO_MY_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    title: "Q1 2026 All-Hands Meeting — Save the Date",
    body: "Please join us on Friday, March 20th at 2:00 PM for our Q1 All-Hands meeting via Google Meet. The CEO will be sharing company performance, upcoming goals, and opening the floor for questions.",
    date: "2026-03-10",
    author: "Chidinma Okeke (HR Manager)",
    isRead: false,
  },
  {
    id: "ann-002",
    title: "Updated Leave & Absence Policy — Effective April 1st",
    body: "We have revised our Leave and Absence Policy to include enhanced paternity leave (now 14 days) and clearer guidelines on unpaid leave. Please review the full document in the Knowledge Base.",
    date: "2026-03-08",
    author: "Chidinma Okeke (HR Manager)",
    isRead: false,
  },
  {
    id: "ann-003",
    title: "March 2026 Salary Review Schedule",
    body: "Annual salary reviews will be conducted between March 24–28. Line managers will be scheduling 1:1s with their direct reports. Please ensure your self-assessment form is submitted by March 21st.",
    date: "2026-03-05",
    author: "Oluwaseun Afolabi (CFO)",
    isRead: true,
  },
];

