"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type { Course } from "@/src/lib/types/learning";
import {
  MY_ENROLLMENTS,
  MOCK_ASSESSMENT,
  COURSES,
} from "./components/data";
import type { MyEnrollment } from "./components/data";
import { TrainingStatCards } from "./components/stat-cards";
import { MyLearningTab } from "./components/my-learning-tab";
import { LibraryTab } from "./components/library-tab";
import { HistoryTab } from "./components/history-tab";
import { PlayerModal } from "./components/player-modal";
import { AssessmentModal } from "./components/assessment-modal";
import { CertificateModal } from "./components/certificate-modal";
import { EnrollModal } from "./components/enroll-modal";
import { CourseDetailModal } from "./components/course-detail-modal";

export function EmployeeTraining() {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>(MY_ENROLLMENTS);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>("all");

  const [selectedEnrollment, setSelectedEnrollment] = useState<MyEnrollment | null>(null);
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
    const correct = MOCK_ASSESSMENT.filter((q) => answers[q.id] === q.correct).length;
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

  const completedCourses = enrollments.filter((e) => e.status === "completed");
  const totalHoursCompleted = completedCourses.reduce((sum, e) => sum + e.durationHours, 0);
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Learning & Development</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your courses, complete training, and grow your skills.
        </p>
      </div>

      <TrainingStatCards enrollments={enrollments} />

      <Tabs defaultValue="my-learning">
        <PageTabsList
          tabs={[
            { value: "my-learning", label: "My Learning" },
            { value: "library", label: "Course Library" },
            { value: "history", label: "Learning History" },
          ]}
        />

        <TabsContent value="my-learning" className="mt-5">
          <MyLearningTab enrollments={enrollments} onOpenPlayer={openPlayer} />
        </TabsContent>

        <TabsContent value="library" className="mt-5">
          <LibraryTab
            courses={COURSES}
            enrolledCourseIds={enrolledCourseIds}
            enrolledCourseId={enrolledCourseId}
            librarySearch={librarySearch}
            libraryCategoryFilter={libraryCategoryFilter}
            setLibrarySearch={setLibrarySearch}
            setLibraryCategoryFilter={setLibraryCategoryFilter}
            onDetails={(c) => {
              setSelectedCourse(c);
              setCourseDetailOpen(true);
            }}
            onEnroll={(c) => {
              setSelectedCourse(c);
              setEnrollConfirmOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab
            completedCourses={completedCourses}
            totalHoursCompleted={totalHoursCompleted}
            onViewCertificate={(e) => {
              setSelectedEnrollment(e);
              setCertificateOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <PlayerModal
        open={playerOpen}
        enrollment={selectedEnrollment}
        playerProgress={playerProgress}
        playerPlaying={playerPlaying}
        onTogglePlay={() => setPlayerPlaying((p) => !p)}
        onSaveProgress={handleSaveProgress}
        onClose={() => setPlayerOpen(false)}
      />

      <AssessmentModal
        open={assessmentOpen}
        enrollment={selectedEnrollment}
        questions={MOCK_ASSESSMENT}
        answers={answers}
        submitted={assessmentSubmitted}
        score={assessmentScore}
        onAnswer={(qId, idx) => setAnswers((prev) => ({ ...prev, [qId]: idx }))}
        onSubmit={handleSubmitAssessment}
        onRetake={() => {
          setAnswers({});
          setAssessmentSubmitted(false);
          setAssessmentScore(null);
        }}
        onViewCertificate={() => {
          setAssessmentOpen(false);
          setCertificateOpen(true);
        }}
        onClose={() => setAssessmentOpen(false)}
      />

      <CertificateModal
        open={certificateOpen}
        enrollment={selectedEnrollment}
        onClose={() => setCertificateOpen(false)}
      />

      <EnrollModal
        open={enrollConfirmOpen}
        course={selectedCourse}
        onConfirm={handleConfirmEnroll}
        onClose={() => setEnrollConfirmOpen(false)}
      />

      <CourseDetailModal
        open={courseDetailOpen}
        course={selectedCourse}
        isEnrolled={selectedCourse ? enrolledCourseIds.has(selectedCourse.id) : false}
        onClose={() => setCourseDetailOpen(false)}
        onEnroll={(c) => {
          setSelectedCourse(c);
          setEnrollConfirmOpen(true);
        }}
      />
    </div>
  );
}
