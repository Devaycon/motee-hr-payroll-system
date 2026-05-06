import type {
  PerformanceReview,
  PerformanceGoal,
  GoalCategory,
} from "@/src/lib/types/performance";

export const MY_NAME = "Adaeze Okonkwo";

export const MY_REVIEW: PerformanceReview = {
  id: "pr-me-001",
  employeeName: MY_NAME,
  employeeInitials: "AO",
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  reviewType: "mid_year",
  period: "H1 2026",
  status: "in_progress",
  reviewer: "Chidinma Okeke",
  dueDate: "2026-04-30",
};

export const PAST_REVIEWS: PerformanceReview[] = [
  {
    id: "pr-me-past-001",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    jobTitle: "Senior Software Engineer",
    department: "Engineering",
    reviewType: "annual",
    period: "2025",
    status: "completed",
    reviewer: "Chidinma Okeke",
    rating: 4,
    strengths:
      "Exceptional technical delivery, mentors junior engineers effectively, consistently meets deadlines.",
    improvements:
      "Could improve stakeholder communication and documentation.",
    comments:
      "A reliable and strong performer. Demonstrates clear growth since joining the engineering team.",
    dueDate: "2025-12-15",
    completedDate: "2025-12-10",
  },
  {
    id: "pr-me-past-002",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    jobTitle: "Software Engineer",
    department: "Engineering",
    reviewType: "mid_year",
    period: "H1 2025",
    status: "completed",
    reviewer: "Chidinma Okeke",
    rating: 4,
    strengths: "Strong problem-solving, self-starter, good team player.",
    improvements: "Take more ownership on high-impact initiatives.",
    comments: "Good first half. Promoted to Senior in Q3.",
    dueDate: "2025-06-30",
    completedDate: "2025-06-28",
  },
];

export const MY_GOALS_INITIAL: PerformanceGoal[] = [
  {
    id: "pg-me-001",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Lead the API Gateway refactor project",
    description:
      "Own the architectural design and delivery of the API gateway refactor, reducing latency by 30%.",
    category: "technical",
    status: "on_track",
    progress: 65,
    dueDate: "2026-06-30",
    createdAt: "2026-01-10",
  },
  {
    id: "pg-me-002",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Complete AWS Solutions Architect certification",
    description:
      "Pass the AWS SAA-C03 exam and add the certification to my profile.",
    category: "growth",
    status: "on_track",
    progress: 45,
    dueDate: "2026-07-31",
    createdAt: "2026-02-01",
  },
  {
    id: "pg-me-003",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Mentor 2 junior engineers on code review practices",
    description:
      "Hold bi-weekly sessions and provide structured feedback on PRs for at least 2 junior engineers.",
    category: "leadership",
    status: "on_track",
    progress: 80,
    dueDate: "2026-05-31",
    createdAt: "2026-01-15",
  },
  {
    id: "pg-me-004",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Improve unit test coverage to 85%",
    description:
      "Increase test coverage across all owned services from ~60% to 85%.",
    category: "technical",
    status: "at_risk",
    progress: 38,
    dueDate: "2026-04-30",
    createdAt: "2026-01-10",
  },
  {
    id: "pg-me-005",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Deliver internal React component library v1",
    description:
      "Design, build and document a shared internal component library for all frontend teams.",
    category: "operational",
    status: "completed",
    progress: 100,
    dueDate: "2026-03-31",
    createdAt: "2025-12-01",
    completedAt: "2026-03-22",
  },
];

export const SELF_ASSESSMENT_DRAFT = {
  achievements:
    "Led the API Gateway refactor design, onboarded two junior engineers, and shipped the internal React component library ahead of schedule.",
  challenges:
    "Balancing deep-work coding sessions with increased meeting load during Q1. Time management for certification study has been a challenge.",
  developmentAreas:
    "I want to strengthen my public speaking and stakeholder communication skills, and deepen my distributed systems knowledge.",
  managerFeedback: "",
};

export const PEER_SUGGESTIONS = [
  { name: "Chukwuemeka Eze", initials: "CE", title: "Backend Engineer" },
  { name: "Kelechi Onyekachi", initials: "KO", title: "Frontend Engineer" },
  { name: "Blessing Okafor", initials: "BO", title: "Finance Analyst" },
];

export const CATEGORY_OPTIONS: GoalCategory[] = [
  "technical",
  "leadership",
  "communication",
  "growth",
  "operational",
];
