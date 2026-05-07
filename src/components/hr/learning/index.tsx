"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { CoursesTable } from "./components/courses-table";
import { EnrollmentsTable } from "./components/enrollments-table";
import { CourseModal } from "./components/course-modal";
import { EnrollModal } from "./components/enroll-modal";
import { COURSES, ENROLLMENTS } from "./data";
import type { Course, Enrollment, NewCourse, NewEnrollment } from "./types";

export function LearningPage() {
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(ENROLLMENTS);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

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

  function handleSaveEnrollment(data: NewEnrollment) {
    const course = courses.find((c) => c.id === data.courseId);
    if (!course) return;
    const newEnrollment: Enrollment = {
      ...data,
      id: `enr-${Date.now()}`,
      courseTitle: course.title,
      enrolledDate: new Date().toISOString().split("T")[0],
      progress: 0,
      status: "enrolled",
    };
    setEnrollments((prev) => [newEnrollment, ...prev]);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === data.courseId
          ? { ...c, enrolledCount: (c.enrolledCount ?? 0) + 1 }
          : c,
      ),
    );
  }

  function handleDeleteEnrollment(id: string) {
    setEnrollments((prev) => prev.filter((e) => e.id !== id));
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

      <StatCards courses={courses} enrollments={enrollments} />

      <Tabs defaultValue="courses">
        <PageTabsList
          tabs={[
            { value: "courses", label: `Courses (${courses.length})` },
            {
              value: "enrollments",
              label: `Enrollments (${enrollments.length})`,
            },
          ]}
        />

        <TabsContent value="courses" className="mt-4">
          <CoursesTable
            courses={courses}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
            onAddCourse={handleAddCourse}
          />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4">
          <EnrollmentsTable
            enrollments={enrollments}
            courses={courses}
            onDelete={handleDeleteEnrollment}
            onEnroll={() => setEnrollModalOpen(true)}
          />
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
        onSave={handleSaveEnrollment}
      />
    </div>
  );
}
