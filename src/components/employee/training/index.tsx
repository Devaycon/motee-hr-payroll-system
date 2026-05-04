"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Award,
  ChevronRight,
  Search,
  Filter,
  Star,
  FileText,
  Video,
  X,
  ChevronDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  COURSES,
  ENROLLMENTS,
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_STYLES,
  DELIVERY_MODE_LABELS,
} from "@/src/data/learning-demo";
import type {
  Course,
  CourseCategory,
  Enrollment,
} from "@/src/lib/types/learning";

type EnrollmentStatus =
  | "enrolled"
  | "in_progress"
  | "completed"
  | "dropped"
  | "failed";

interface MyEnrollment {
  id: string;
  courseId: string;
  courseName: string;
  category: CourseCategory;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  durationHours: number;
  instructor: string;
  deliveryMode: string;
}

interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

function toMyEnrollment(en: Enrollment): MyEnrollment {
  const course = COURSES.find((c) => c.id === en.courseId);
  return {
    id: en.id,
    courseId: en.courseId,
    courseName: en.courseName ?? en.courseTitle ?? course?.title ?? "",
    category: course?.category ?? "technical",
    status: en.status,
    progress: en.progress,
    enrolledAt: en.enrolledAt ?? en.enrolledDate ?? "",
    completedAt: en.completedAt,
    score: en.score,
    durationHours: course?.durationHours ?? 0,
    instructor: course?.instructor ?? "",
    deliveryMode: course?.deliveryMode ?? "online",
  };
}

const MY_ENROLLMENTS: MyEnrollment[] = ENROLLMENTS.map(toMyEnrollment);

const MOCK_ASSESSMENT: AssessmentQuestion[] = [
  {
    id: 1,
    question: "What does AML stand for?",
    options: [
      "Asset Management Ledger",
      "Anti-Money Laundering",
      "Annual Monetary Limit",
      "Authorised Monetary Liability",
    ],
    correct: 1,
  },
  {
    id: 2,
    question: "Which of the following is a red flag for money laundering?",
    options: [
      "Regular salary payments",
      "Large cash transactions with no clear business purpose",
      "Quarterly tax filings",
      "Standard bank transfers",
    ],
    correct: 1,
  },
  {
    id: 3,
    question: "What is a Suspicious Activity Report (SAR)?",
    options: [
      "A report filed when a client complains",
      "A quarterly performance summary",
      "A formal report filed when suspicious financial activity is detected",
      "An HR disciplinary record",
    ],
    correct: 2,
  },
];

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProgressBar({
  value,
  color = "#7F77DD",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function EmployeeTraining() {
  const [activeTab, setActiveTab] = useState<
    "my-learning" | "library" | "history"
  >("my-learning");
  const [enrollments, setEnrollments] =
    useState<MyEnrollment[]>(MY_ENROLLMENTS);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategoryFilter, setLibraryCategoryFilter] =
    useState<string>("all");
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<MyEnrollment | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [enrollConfirmOpen, setEnrollConfirmOpen] = useState(false);
  const [courseDetailOpen, setCourseDetailOpen] = useState(false);

  const [playerProgress, setPlayerProgress] = useState(0);
  const [playerPlaying, setPlayerPlaying] = useState(false);
  const playerInterval = useRef<NodeJS.Timeout | null>(null);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  const [enrolledCourseId, setEnrolledCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (playerPlaying) {
      playerInterval.current = setInterval(() => {
        setPlayerProgress((p) => {
          if (p >= 100) {
            setPlayerPlaying(false);
            clearInterval(playerInterval.current!);
            return 100;
          }
          return p + 0.5;
        });
      }, 200);
    } else {
      if (playerInterval.current) clearInterval(playerInterval.current);
    }
    return () => {
      if (playerInterval.current) clearInterval(playerInterval.current);
    };
  }, [playerPlaying]);

  function openPlayer(enrollment: MyEnrollment) {
    setSelectedEnrollment(enrollment);
    setPlayerProgress(enrollment.progress);
    setPlayerPlaying(false);
    setAssessmentSubmitted(false);
    setAnswers({});
    setAssessmentScore(null);
    setPlayerOpen(true);
  }

  function handleSaveProgress() {
    const newProgress = Math.round(playerProgress);
    setEnrollments((prev) =>
      prev.map((e) =>
        e.id === selectedEnrollment?.id
          ? {
              ...e,
              progress: newProgress,
              status:
                newProgress === 100
                  ? "completed"
                  : newProgress > 0
                    ? "in_progress"
                    : e.status,
              completedAt:
                newProgress === 100
                  ? new Date().toISOString().split("T")[0]
                  : e.completedAt,
            }
          : e,
      ),
    );
    setPlayerOpen(false);
    if (newProgress === 100 && !assessmentSubmitted) {
      setAssessmentOpen(true);
    }
  }

  function handleSubmitAssessment() {
    const correct = MOCK_ASSESSMENT.filter(
      (q) => answers[q.id] === q.correct,
    ).length;
    const score = Math.round((correct / MOCK_ASSESSMENT.length) * 100);
    setAssessmentScore(score);
    setAssessmentSubmitted(true);
    if (score >= 70) {
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === selectedEnrollment?.id ? { ...e, score } : e,
        ),
      );
    }
  }

  function handleViewCertificate() {
    setAssessmentOpen(false);
    setCertificateOpen(true);
  }

  function handleEnrollRequest(course: Course) {
    setSelectedCourse(course);
    setEnrollConfirmOpen(true);
  }

  function handleConfirmEnroll() {
    if (!selectedCourse) return;
    const newEnrollment: MyEnrollment = {
      id: `me-${Date.now()}`,
      courseId: selectedCourse.id,
      courseName: selectedCourse.title,
      category: selectedCourse.category,
      status: "enrolled",
      progress: 0,
      enrolledAt: new Date().toISOString().split("T")[0],
      durationHours: selectedCourse.durationHours,
      instructor: selectedCourse.instructor,
      deliveryMode: selectedCourse.deliveryMode,
    };
    setEnrollments((prev) => [...prev, newEnrollment]);
    setEnrolledCourseId(selectedCourse.id);
    setEnrollConfirmOpen(false);
    setTimeout(() => setEnrolledCourseId(null), 3000);
  }

  const activeCourses = enrollments.filter(
    (e) => e.status === "enrolled" || e.status === "in_progress",
  );
  const completedCourses = enrollments.filter((e) => e.status === "completed");
  const overdueCourses = activeCourses.filter(
    (e) => e.dueDate && daysUntil(e.dueDate) < 0,
  );
  const totalHoursCompleted = completedCourses.reduce(
    (sum, e) => sum + e.durationHours,
    0,
  );

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const libraryCourses = COURSES.filter((c) => {
    if (c.status === "draft") return false;
    const matchSearch =
      librarySearch === "" ||
      c.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(librarySearch.toLowerCase()));
    const matchCat =
      libraryCategoryFilter === "all" || c.category === libraryCategoryFilter;
    return matchSearch && matchCat;
  });

  const tabs = [
    { key: "my-learning", label: "My Learning" },
    { key: "library", label: "Course Library" },
    { key: "history", label: "Learning History" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Learning & Development
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your courses, complete training, and grow your skills.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Assigned",
            value: activeCourses.length,
            icon: BookOpen,
            color: "#7F77DD",
          },
          {
            label: "In Progress",
            value: activeCourses.filter((e) => e.status === "in_progress")
              .length,
            icon: TrendingUp,
            color: "#F59E0B",
          },
          {
            label: "Completed",
            value: completedCourses.length,
            icon: CheckCircle2,
            color: "#1D9E75",
          },
          {
            label: "Overdue",
            value: overdueCourses.length,
            icon: AlertTriangle,
            color: "#EF4444",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[#7F77DD] text-[#7F77DD]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "my-learning" && (
        <div className="space-y-4">
          {overdueCourses.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                You have{" "}
                <span className="font-semibold">
                  {overdueCourses.length} overdue course
                  {overdueCourses.length > 1 ? "s" : ""}
                </span>
                . Please complete them as soon as possible.
              </p>
            </div>
          )}

          {activeCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No active courses. Browse the Course Library to enrol.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCourses.map((enrollment) => {
                const due = enrollment.dueDate
                  ? daysUntil(enrollment.dueDate)
                  : null;
                const isOverdue = due !== null && due < 0;
                const isDueSoon = due !== null && due >= 0 && due <= 7;
                return (
                  <Card
                    key={enrollment.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <Badge
                            className={`text-xs ${COURSE_CATEGORY_STYLES[enrollment.category]}`}
                          >
                            {COURSE_CATEGORY_LABELS[enrollment.category]}
                          </Badge>
                          <p className="font-semibold text-sm text-foreground leading-snug">
                            {enrollment.courseName}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs shrink-0 ${ENROLLMENT_STATUS_STYLES[enrollment.status]}`}
                        >
                          {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="font-medium text-foreground">
                            {enrollment.progress}%
                          </span>
                        </div>
                        <ProgressBar value={enrollment.progress} />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {enrollment.durationHours}h
                        </span>
                        <span>•</span>
                        <span>
                          {DELIVERY_MODE_LABELS[
                            enrollment.deliveryMode as keyof typeof DELIVERY_MODE_LABELS
                          ] ?? enrollment.deliveryMode}
                        </span>
                        {enrollment.dueDate && (
                          <>
                            <span>•</span>
                            <span
                              className={
                                isOverdue
                                  ? "text-red-500 font-medium"
                                  : isDueSoon
                                    ? "text-amber-500 font-medium"
                                    : ""
                              }
                            >
                              {isOverdue
                                ? `${Math.abs(due!)}d overdue`
                                : `Due in ${due}d`}
                            </span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="w-full text-white"
                        style={{ backgroundColor: "#7F77DD" }}
                        onClick={() => openPlayer(enrollment)}
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                        {enrollment.status === "enrolled"
                          ? "Start Course"
                          : "Continue"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search courses, topics, tags..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
              />
            </div>
            <Select
              value={libraryCategoryFilter}
              onValueChange={setLibraryCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(
                  Object.entries(COURSE_CATEGORY_LABELS) as [
                    CourseCategory,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {libraryCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No courses match your search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {libraryCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.has(course.id);
                const justEnrolled = enrolledCourseId === course.id;
                return (
                  <Card
                    key={course.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <Badge
                            className={`text-xs ${COURSE_CATEGORY_STYLES[course.category]}`}
                          >
                            {COURSE_CATEGORY_LABELS[course.category]}
                          </Badge>
                          <p className="font-semibold text-sm text-foreground leading-snug">
                            {course.title}
                          </p>
                        </div>
                        {isEnrolled && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
                            Enrolled
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.durationHours}h
                        </span>
                        <span>•</span>
                        <span>{DELIVERY_MODE_LABELS[course.deliveryMode]}</span>
                        <span>•</span>
                        <span>{course.instructor}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedCourse(course);
                            setCourseDetailOpen(true);
                          }}
                        >
                          Details
                        </Button>
                        {!isEnrolled ? (
                          <Button
                            size="sm"
                            className="flex-1 text-white"
                            style={{ backgroundColor: "#7F77DD" }}
                            onClick={() => handleEnrollRequest(course)}
                          >
                            Enrol
                          </Button>
                        ) : justEnrolled ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 text-white"
                            disabled
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Enrolled!
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled
                          >
                            Enrolled
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/40">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {completedCourses.length}
              </p>
              <p className="text-xs text-muted-foreground">Courses Completed</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {totalHoursCompleted}h
              </p>
              <p className="text-xs text-muted-foreground">Learning Hours</p>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {completedCourses.filter((e) => e.score !== undefined).length >
                0
                  ? Math.round(
                      completedCourses
                        .filter((e) => e.score !== undefined)
                        .reduce((sum, e) => sum + (e.score ?? 0), 0) /
                        completedCourses.filter((e) => e.score !== undefined)
                          .length,
                    )
                  : "—"}
                {completedCourses.filter((e) => e.score !== undefined).length >
                  0 && "%"}
              </p>
              <p className="text-xs text-muted-foreground">Avg. Score</p>
            </div>
          </div>

          {completedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No completed courses yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedCourses.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={`text-xs ${COURSE_CATEGORY_STYLES[enrollment.category]}`}
                          >
                            {COURSE_CATEGORY_LABELS[enrollment.category]}
                          </Badge>
                          <p className="font-semibold text-sm text-foreground">
                            {enrollment.courseName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Completed{" "}
                            {enrollment.completedAt
                              ? formatDate(enrollment.completedAt)
                              : "—"}
                          </span>
                          <span>•</span>
                          <span>{enrollment.durationHours}h</span>
                          {enrollment.score !== undefined && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-500 font-medium">
                                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                                {enrollment.score}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setCertificateOpen(true);
                          }}
                        >
                          <Award className="w-3.5 h-3.5 mr-1.5" />
                          Certificate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={playerOpen} onOpenChange={setPlayerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedEnrollment?.courseName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-900 aspect-video flex flex-col items-center justify-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedEnrollment?.deliveryMode === "online" ? (
                  <Video className="w-16 h-16 text-slate-600" />
                ) : (
                  <FileText className="w-16 h-16 text-slate-600" />
                )}
              </div>
              <button
                onClick={() => setPlayerPlaying((p) => !p)}
                className="relative z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                {playerPlaying ? (
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-5 bg-white rounded-sm" />
                    <div className="w-1.5 h-5 bg-white rounded-sm" />
                  </div>
                ) : (
                  <Play className="w-6 h-6 text-white ml-1" />
                )}
              </button>
              <p className="relative z-10 text-white/60 text-xs">
                {playerPlaying ? "Playing..." : "Click to play"}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">
                  {Math.round(playerProgress)}%
                </span>
              </div>
              <ProgressBar value={playerProgress} />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPlayerOpen(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: "#7F77DD" }}
                onClick={handleSaveProgress}
              >
                Save Progress & Exit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assessmentOpen} onOpenChange={setAssessmentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              End-of-Course Assessment
            </DialogTitle>
          </DialogHeader>
          {!assessmentSubmitted ? (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                {selectedEnrollment?.courseName} — Answer all questions to
                complete.
              </p>
              {MOCK_ASSESSMENT.map((q) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {q.id}. {q.question}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                        }
                        className={`w-full text-left text-sm px-3 py-2 rounded-md border transition ${
                          answers[q.id] === idx
                            ? "border-[#7F77DD] bg-[#7F77DD]/10 text-[#7F77DD]"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                className="w-full text-white"
                style={{ backgroundColor: "#7F77DD" }}
                disabled={Object.keys(answers).length < MOCK_ASSESSMENT.length}
                onClick={handleSubmitAssessment}
              >
                Submit Assessment
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              {assessmentScore !== null && assessmentScore >= 70 ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      Passed! 🎉
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your score:{" "}
                      <span className="font-semibold text-foreground">
                        {assessmentScore}%
                      </span>
                    </p>
                  </div>
                  <Button
                    className="text-white"
                    style={{ backgroundColor: "#7F77DD" }}
                    onClick={handleViewCertificate}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    View Certificate
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">
                      Not Passed
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your score:{" "}
                      <span className="font-semibold text-foreground">
                        {assessmentScore}%
                      </span>
                      . You need 70% to pass.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAnswers({});
                      setAssessmentSubmitted(false);
                      setAssessmentScore(null);
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake Assessment
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              Completion Certificate
            </DialogTitle>
          </DialogHeader>
          <div className="border-2 border-[#7F77DD]/40 rounded-xl p-6 text-center space-y-3 bg-gradient-to-b from-[#7F77DD]/5 to-transparent">
            <Award className="w-12 h-12 mx-auto text-[#7F77DD]" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Certificate of Completion
            </p>
            <p className="text-lg font-bold text-foreground">
              {selectedEnrollment?.courseName}
            </p>
            <p className="text-sm text-muted-foreground">
              Awarded to{" "}
              <span className="font-semibold text-foreground">
                Amaka Johnson
              </span>
            </p>
            {selectedEnrollment?.score !== undefined && (
              <p className="text-sm text-muted-foreground">
                Score:{" "}
                <span className="font-semibold text-foreground">
                  {selectedEnrollment.score}%
                </span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedEnrollment?.completedAt
                ? formatDate(selectedEnrollment.completedAt)
                : formatDate(new Date().toISOString().split("T")[0])}
            </p>
          </div>
          <Button
            className="w-full text-white"
            style={{ backgroundColor: "#7F77DD" }}
            onClick={() => setCertificateOpen(false)}
          >
            Save to My Documents
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollConfirmOpen} onOpenChange={setEnrollConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirm Enrolment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are about to enrol in:
            </p>
            <p className="font-semibold text-foreground text-sm">
              {selectedCourse?.title}
            </p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{selectedCourse?.durationHours}h</span>
              <span>•</span>
              <span>
                {selectedCourse
                  ? DELIVERY_MODE_LABELS[selectedCourse.deliveryMode]
                  : ""}
              </span>
              <span>•</span>
              <span>{selectedCourse?.instructor}</span>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEnrollConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: "#7F77DD" }}
                onClick={handleConfirmEnroll}
              >
                Confirm Enrolment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={courseDetailOpen} onOpenChange={setCourseDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedCourse?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <Badge
                className={`text-xs ${COURSE_CATEGORY_STYLES[selectedCourse.category]}`}
              >
                {COURSE_CATEGORY_LABELS[selectedCourse.category]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {selectedCourse.description}
              </p>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium text-foreground">
                    {selectedCourse.durationHours} hours
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Mode</p>
                  <p className="font-medium text-foreground">
                    {DELIVERY_MODE_LABELS[selectedCourse.deliveryMode]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="font-medium text-foreground">
                    {selectedCourse.instructor}
                  </p>
                </div>
                {selectedCourse.capacity && (
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-medium text-foreground">
                      {selectedCourse.enrolled ?? 0} / {selectedCourse.capacity}
                    </p>
                  </div>
                )}
                {selectedCourse.startDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedCourse.startDate)}
                    </p>
                  </div>
                )}
                {selectedCourse.endDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="font-medium text-foreground">
                      {formatDate(selectedCourse.endDate)}
                    </p>
                  </div>
                )}
              </div>
              {selectedCourse.tags.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCourse.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCourseDetailOpen(false)}
                >
                  Close
                </Button>
                {!enrolledCourseIds.has(selectedCourse.id) && (
                  <Button
                    className="flex-1 text-white"
                    style={{ backgroundColor: "#7F77DD" }}
                    onClick={() => {
                      setCourseDetailOpen(false);
                      handleEnrollRequest(selectedCourse);
                    }}
                  >
                    Enrol Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
