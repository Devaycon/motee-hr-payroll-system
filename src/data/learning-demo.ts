import type {
  Course,
  CourseQuiz,
  Enrollment,
  CourseCategory,
  CourseStatus,
  CourseDeliveryMode,
  EnrollmentStatus,
} from "@/src/lib/types/learning";

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  technical:   "Technical",
  leadership:  "Leadership",
  compliance:  "Compliance",
  soft_skills: "Soft Skills",
  onboarding:  "Onboarding",
  product:     "Product",
};

export const COURSE_CATEGORY_STYLES: Record<CourseCategory, string> = {
  technical:   "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  leadership:  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  compliance:  "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  soft_skills: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400",
  onboarding:  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
  product:     "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  active:   "Active",
  draft:    "Draft",
  archived: "Archived",
};

export const COURSE_STATUS_STYLES: Record<CourseStatus, string> = {
  active:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  draft:    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  archived: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const DELIVERY_MODE_LABELS: Record<CourseDeliveryMode, string> = {
  online:     "Online",
  in_person:  "In Person",
  hybrid:     "Hybrid",
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  not_attempted: "Not Attempted",
  enrolled:    "Enrolled",
  in_progress: "In Progress",
  completed:   "Completed",
  dropped:     "Dropped",
  failed:      "Failed",
};

export const ENROLLMENT_STATUS_STYLES: Record<EnrollmentStatus, string> = {
  not_attempted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  enrolled:    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  completed:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  dropped:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  failed:      "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

/** Public sample MP4s (Google GTV sample bucket) used as demo training videos. */
const SAMPLE_VIDEO = (name: string) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${name}.mp4`;

const tf = (prompt: string, correctIndex: 0 | 1, points = 1) => ({
  id: prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24),
  type: "true_false" as const,
  prompt,
  options: ["True", "False"],
  correctIndex,
  points,
});

const AML_QUIZ: CourseQuiz = {
  passingScore: 70,
  maxAttempts: 3,
  questions: [
    {
      id: "aml-q1",
      type: "mcq",
      prompt: "What does AML stand for?",
      options: [
        "Asset Management Ledger",
        "Anti-Money Laundering",
        "Annual Monetary Limit",
        "Authorised Monetary Liability",
      ],
      correctIndex: 1,
      points: 2,
    },
    {
      id: "aml-q2",
      type: "mcq",
      prompt: "Which of the following is a red flag for money laundering?",
      options: [
        "Regular salary payments",
        "Large cash transactions with no clear business purpose",
        "Quarterly tax filings",
        "Standard bank transfers",
      ],
      correctIndex: 1,
      points: 2,
    },
    tf("A Suspicious Activity Report (SAR) must be filed when suspicious financial activity is detected.", 0, 1),
  ],
};

const PYTHON_QUIZ: CourseQuiz = {
  passingScore: 60,
  maxAttempts: 2,
  questions: [
    {
      id: "py-q1",
      type: "mcq",
      prompt: "Which library is primarily used for data manipulation in Python?",
      options: ["Pandas", "Flask", "Pillow", "Requests"],
      correctIndex: 0,
      points: 1,
    },
    tf("NumPy arrays are more memory-efficient than native Python lists for numeric data.", 0, 1),
  ],
};

export const COURSES: Course[] = [
  { id: "c-001", title: "Python for Data Analysis", description: "Learn data manipulation and visualisation using Pandas, NumPy, and Matplotlib.", category: "technical", status: "active", deliveryMode: "online", instructor: "Dr. Eze Nnamdi", videoUrl: SAMPLE_VIDEO("BigBuckBunny"), quiz: PYTHON_QUIZ, durationHours: 20, capacity: 30, enrolled: 24, startDate: "2026-02-01", endDate: "2026-03-15", tags: ["python", "data", "analytics"], createdAt: "2025-12-01" },
  { id: "c-002", title: "Leadership Essentials", description: "Develop core leadership skills including communication, delegation, and conflict resolution.", category: "leadership", status: "active", deliveryMode: "in_person", instructor: "Mrs. Adaeze Okonkwo", videoUrl: SAMPLE_VIDEO("ElephantsDream"), durationHours: 12, capacity: 20, enrolled: 15, startDate: "2026-02-10", endDate: "2026-02-12", tags: ["leadership", "management"], createdAt: "2025-12-10" },
  { id: "c-003", title: "Anti-Money Laundering (AML) 2026", description: "Mandatory annual compliance training covering AML regulations and reporting obligations.", category: "compliance", status: "active", deliveryMode: "online", instructor: "Compliance Team", videoUrl: SAMPLE_VIDEO("ForBiggerBlazes"), quiz: AML_QUIZ, durationHours: 4, enrolled: 183, startDate: "2026-01-01", endDate: "2026-03-31", tags: ["AML", "compliance", "mandatory"], createdAt: "2025-11-01" },
  { id: "c-004", title: "Effective Communication at Work", description: "Build skills for clear written and verbal communication in professional settings.", category: "soft_skills", status: "active", deliveryMode: "hybrid", instructor: "Babatunde Lawal", videoUrl: SAMPLE_VIDEO("ForBiggerEscapes"), durationHours: 8, capacity: 25, enrolled: 18, startDate: "2026-02-15", endDate: "2026-02-16", tags: ["communication", "soft skills"], createdAt: "2025-12-15" },
  { id: "c-005", title: "New Employee Orientation", description: "Comprehensive onboarding programme for all new joiners.", category: "onboarding", status: "active", deliveryMode: "hybrid", instructor: "HR Team", videoUrl: SAMPLE_VIDEO("ForBiggerFun"), durationHours: 6, enrolled: 12, tags: ["onboarding", "orientation"], createdAt: "2024-01-01" },
  { id: "c-006", title: "Product Roadmap Q1 2026", description: "Internal product training on the Q1 2026 product roadmap and feature set.", category: "product", status: "draft", deliveryMode: "online", instructor: "Product Team", videoUrl: SAMPLE_VIDEO("ForBiggerJoyrides"), durationHours: 3, enrolled: 0, tags: ["product", "roadmap"], createdAt: "2026-01-10" },
];

export const ENROLLMENTS: Enrollment[] = [
  { id: "en-001", courseId: "c-001", courseName: "Python for Data Analysis", employeeName: "Emeka Nwosu", employeeInitials: "EN", employeeDept: "Engineering", status: "in_progress", progress: 60, enrolledAt: "2026-02-01", dueDate: "2026-03-15", score: undefined },
  { id: "en-002", courseId: "c-001", courseName: "Python for Data Analysis", employeeName: "Tunde Badmus", employeeInitials: "TB", employeeDept: "Engineering", status: "not_attempted", progress: 0, enrolledAt: "2026-02-01", dueDate: "2026-03-15" },
  { id: "en-003", courseId: "c-002", courseName: "Leadership Essentials", employeeName: "Chukwuebuka Obi", employeeInitials: "CO", employeeDept: "Sales", status: "completed", progress: 100, enrolledAt: "2026-02-10", completedAt: "2026-02-12", score: 88 },
  { id: "en-004", courseId: "c-003", courseName: "Anti-Money Laundering (AML) 2026", employeeName: "Halima Musa", employeeInitials: "HM", employeeDept: "Human Resources", status: "completed", progress: 100, enrolledAt: "2026-01-05", dueDate: "2026-02-01", completedAt: "2026-01-06", score: 92, quizPassed: true, quizAttempts: [{ at: "2026-01-06", score: 92, passed: true }] },
  { id: "en-005", courseId: "c-003", courseName: "Anti-Money Laundering (AML) 2026", employeeName: "Aisha Garba", employeeInitials: "AG", employeeDept: "Legal", status: "completed", progress: 100, enrolledAt: "2026-01-05", dueDate: "2026-02-01", completedAt: "2026-01-07", score: 100, quizPassed: true, quizAttempts: [{ at: "2026-01-06", score: 60, passed: false }, { at: "2026-01-07", score: 100, passed: true }] },
  { id: "en-006", courseId: "c-003", courseName: "Anti-Money Laundering (AML) 2026", employeeName: "Ngozi Obi", employeeInitials: "NO", employeeDept: "Finance", status: "in_progress", progress: 50, enrolledAt: "2026-01-10", dueDate: "2026-03-31" },
  { id: "en-007", courseId: "c-004", courseName: "Effective Communication at Work", employeeName: "Babatunde Lawal", employeeInitials: "BL", employeeDept: "Marketing", status: "completed", progress: 100, enrolledAt: "2026-02-15", completedAt: "2026-02-16", score: 80 },
  { id: "en-008", courseId: "c-005", courseName: "New Employee Orientation", employeeName: "Chiamaka Eze", employeeInitials: "CE", employeeDept: "Operations", status: "completed", progress: 100, enrolledAt: "2026-01-15", completedAt: "2026-01-15", score: 95 },
];

export const DEPARTMENT_OPTIONS: string[] = [
  "all",
  "Engineering",
  "Human Resources",
  "Finance",
  "Marketing",
  "Product",
  "Sales",
  "Operations",
  "Legal",
];
