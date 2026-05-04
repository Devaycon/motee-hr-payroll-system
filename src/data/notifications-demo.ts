export type NotifType =
  | "success"
  | "info"
  | "warning"
  | "calendar"
  | "file"
  | "trending";

export type Notification = {
  id: string;
  title: string;
  description: string;
  detail: string;
  date: string;
  time: string;
  read: boolean;
  type: NotifType;
};

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Leave Request Approved",
    description: "Your annual leave for Mar 20\u201324 has been approved by HR.",
    detail:
      "Your leave request has been reviewed and approved by your HR Administrator.\n\nLeave Type: Annual Leave\nDuration: March 20 \u2013 March 24, 2026 (5 working days)\nApproved by: Admin Officer\nApproval Date: March 14, 2026\nRemaining Leave Balance: 13 days\n\nPlease ensure your work is handed over to your team lead before your leave begins. Contact HR if you need to make any amendments to this request.",
    date: "March 14, 2026",
    time: "10:42 AM",
    read: false,
    type: "success",
  },
  {
    id: "2",
    title: "New Payslip Available",
    description: "Your February 2026 payslip is ready to download.",
    detail:
      "Your payslip for February 2026 is now available in the payroll section.\n\nPay Period: February 1 \u2013 February 28, 2026\nGross Pay: $4,000.00\nTotal Deductions: $800.00\n  \u2022 Income Tax: $550.00\n  \u2022 Pension: $250.00\nNet Pay: $3,200.00\n\nYou can download your payslip from the Payslips section under My Profile. Contact payroll@company.com for any discrepancies.",
    date: "March 14, 2026",
    time: "9:15 AM",
    read: false,
    type: "file",
  },
  {
    id: "3",
    title: "Performance Review Due",
    description: "Your Q1 self-assessment is due by March 20.",
    detail:
      "Your Q1 2026 performance self-assessment is due in 6 days.\n\nDeadline: March 20, 2026\nReview Cycle: Q1 2026 (January \u2013 March)\nAssigned Reviewer: Sarah Manager\n\nYou will be assessed on 4 key competencies:\n  \u2022 Technical Skills\n  \u2022 Communication\n  \u2022 Teamwork\n  \u2022 Delivery & Impact\n\nPlease complete your self-assessment in the Performance section under the Growth portal. Failure to submit by the deadline may affect your performance score for the quarter.",
    date: "March 13, 2026",
    time: "8:00 AM",
    read: false,
    type: "warning",
  },
  {
    id: "4",
    title: "Q1 All-Hands Scheduled",
    description: "The Q1 company all-hands is confirmed for March 15.",
    detail:
      "The Q1 2026 company all-hands meeting has been confirmed.\n\nDate: Saturday, March 15, 2026\nTime: 10:00 AM \u2013 12:00 PM\nLocation: Main Conference Hall / Zoom\nMeeting Link: zoom.us/j/demo-link\n\nAgenda:\n  1. CEO Update \u2013 Q1 Performance & Outlook\n  2. Department Highlights\n  3. Product Roadmap Preview\n  4. Q&A Session\n\nAttendance is mandatory for all full-time employees. Remote employees should join via the Zoom link above.",
    date: "March 12, 2026",
    time: "2:30 PM",
    read: true,
    type: "calendar",
  },
  {
    id: "5",
    title: "New Company Policy",
    description: "The updated remote work policy is now effective.",
    detail:
      "The updated Remote Work Policy is now in effect as of March 10, 2026.\n\nKey changes include:\n  \u2022 Employees may work remotely up to 3 days per week\n  \u2022 All remote days must be pre-approved by your line manager\n  \u2022 Core hours (10 AM \u2013 3 PM) must be observed regardless of location\n  \u2022 Equipment allowance increased to $500/year for home office setup\n\nThe full policy document is available in the Company Knowledge Base. Please review and acknowledge receipt by March 21, 2026.",
    date: "March 10, 2026",
    time: "11:00 AM",
    read: true,
    type: "info",
  },
  {
    id: "6",
    title: "Goal Progress Updated",
    description: "Your Q1 goal 'Complete onboarding tasks' is at 80%.",
    detail:
      "Your Q1 2026 goal has been automatically updated based on completed milestones.\n\nGoal: Complete onboarding tasks\nProgress: 80% (4 of 5 tasks completed)\nRemaining task: Submit signed benefits enrollment form\nDeadline: March 31, 2026\n\nCompleted:\n  \u2713 IT equipment setup\n  \u2713 HR documentation\n  \u2713 Complete compliance training\n  \u2713 Meet with line manager\n\nKeep it up! Complete the remaining task to hit 100% before end of Q1.",
    date: "March 9, 2026",
    time: "3:15 PM",
    read: true,
    type: "trending",
  },
  {
    id: "7",
    title: "Training Reminder",
    description: "Leadership 101 training starts April 1 \u2014 register now.",
    detail:
      "The Leadership 101 training program starts April 1, 2026. Registration closes March 25.\n\nCourse: Leadership 101\nFormat: Virtual (4 sessions)\nSchedule:\n  \u2022 Session 1: April 1, 2026 \u2013 Introduction to Leadership\n  \u2022 Session 2: April 8, 2026 \u2013 Communication & Influence\n  \u2022 Session 3: April 15, 2026 \u2013 Decision Making\n  \u2022 Session 4: April 22, 2026 \u2013 Building High-Performance Teams\n\nTo register, go to the Training section under the Growth portal and click Enroll. Seats are limited.",
    date: "March 8, 2026",
    time: "9:00 AM",
    read: true,
    type: "calendar",
  },
];
