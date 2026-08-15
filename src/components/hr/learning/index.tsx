"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useLearning } from "./hooks";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  StatCards,
  matchesCourseCardFilter,
  matchesEnrollmentCardFilter,
  LEARNING_CARD_FILTER_LABELS,
  type LearningCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { CoursesTable } from "./components/courses-table";
import { EnrollmentsTable } from "./components/enrollments-table";
import { ResultsTable } from "./components/results-table";
import { CourseModal } from "./components/course-modal";
import { EnrollModal } from "./components/enroll-modal";
import { QuizBuilderModal } from "./components/quiz-builder-modal";
import type {
  Course,
  CourseQuiz,
  Enrollment,
  NewCourse,
} from "./types";

export function LearningPage() {
  const { data, loading } = useLearning();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Seed local working state from the loaded demo data once.
  if (data && !hydrated) {
    setHydrated(true);
    setCourses(data.courses);
    setEnrollments(data.enrollments);
  }

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("courses");
  /** Drill-down set by the KPI cards; "all" shows every row. */
  const [cardFilter, setCardFilter] = useState<LearningCardFilter>("all");

  const visibleCourses = courses.filter((c) =>
    matchesCourseCardFilter(c, cardFilter),
  );
  const visibleEnrollments = enrollments.filter((e) =>
    matchesEnrollmentCardFilter(e, cardFilter),
  );

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  const [quizCourse, setQuizCourse] = useState<Course | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  function handleAddCourse() {
    setEditingCourse(null);
    setCourseModalOpen(true);
  }

  function handleEditCourse(course: Course) {
    setEditingCourse(course);
    setCourseModalOpen(true);
  }

  function handleSaveCourse(data: NewCourse) {
    if (editingCourse) {
      setCourses((prev) =>
        prev.map((c) => (c.id === editingCourse.id ? { ...c, ...data } : c)),
      );
    } else {
      const newCourse: Course = {
        ...data,
        id: `course-${Date.now()}`,
        enrolledCount: 0,
        completionCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setCourses((prev) => [newCourse, ...prev]);
    }
  }

  function handleDeleteCourse(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  function handleManageQuiz(course: Course) {
    setQuizCourse(course);
    setQuizModalOpen(true);
  }

  function handleSaveQuiz(courseId: string, quiz: CourseQuiz) {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, quiz } : c)));
  }

  function handleAssign(input: {
    courseId: string;
    dueDate: string;
    trainees: { employeeName: string; employeeInitials: string; employeeDept: string }[];
  }) {
    const course = courses.find((c) => c.id === input.courseId);
    if (!course) return;
    const today = new Date().toISOString().split("T")[0];
    const newEnrollments: Enrollment[] = input.trainees.map((t, i) => ({
      id: `enr-${Date.now()}-${i}`,
      courseId: input.courseId,
      courseTitle: course.title,
      employeeName: t.employeeName,
      employeeInitials: t.employeeInitials,
      employeeDept: t.employeeDept,
      department: t.employeeDept,
      enrolledDate: today,
      dueDate: input.dueDate || undefined,
      progress: 0,
      status: "enrolled",
    }));
    setEnrollments((prev) => [...newEnrollments, ...prev]);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === input.courseId
          ? { ...c, enrolledCount: (c.enrolledCount ?? 0) + newEnrollments.length }
          : c,
      ),
    );
  }

  function handleDeleteEnrollment(id: string) {
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading && !courses.length) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold">Learning & Development</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage training courses and track employee learning progress across
          your organisation.
        </p>
      </div>

      <StatCards
        courses={courses}
        enrollments={enrollments}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {LEARNING_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              (
              {cardFilter === "active_courses"
                ? visibleCourses.length
                : visibleEnrollments.length}
              )
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Show all
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "courses", label: `Courses (${visibleCourses.length})` },
            {
              value: "enrollments",
              label: `Enrollments (${visibleEnrollments.length})`,
            },
            { value: "results", label: "Results" },
          ]}
        />

        <TabsContent value="courses" className="mt-4">
          <CoursesTable
            courses={visibleCourses}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
            onAddCourse={handleAddCourse}
            onManageQuiz={handleManageQuiz}
          />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <EnrollmentsTable
            enrollments={visibleEnrollments}
            courses={courses}
            onDelete={handleDeleteEnrollment}
            onEnroll={() => setEnrollModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsTable courses={courses} enrollments={enrollments} />
        </TabsContent>
      </Tabs>

      <CourseModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        editingCourse={editingCourse}
        onSave={handleSaveCourse}
      />

      <EnrollModal
        open={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        courses={courses}
        employees={employees}
        onAssign={handleAssign}
      />

      <QuizBuilderModal
        open={quizModalOpen}
        course={quizCourse}
        onClose={() => setQuizModalOpen(false)}
        onSave={handleSaveQuiz}
      />
    </div>
  );
}
