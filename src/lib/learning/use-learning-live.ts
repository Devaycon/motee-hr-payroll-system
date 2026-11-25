"use client";

import { useMemo } from "react";
import {
  isServerId,
  useIsLive,
  useLiveSender,
  useMyEmployeeId,
} from "@/src/lib/live/use-is-live";
import {
  certificationFromApi,
  certificationToRequest,
  courseFromApi,
  courseToRequest,
  enrollmentFromApi,
  quizFromApi,
  quizToRequest,
} from "./api-mapping";
import {
  useGetAllCertificationsQuery,
  useGetAllLearningCoursesQuery,
  useGetAllLearningEnrollmentsQuery,
} from "@/src/store/services/collections";
import {
  useCreateLearningCourseMutation,
  useDeleteLearningCourseMutation,
  useDeleteLearningEnrollmentMutation,
  useEnrollInLearningCourseMutation,
  useGetMyLearningQuery,
  useLazyGetLearningCourseQuizQuery,
  useLazyGetMyLearningQuizQuery,
  useSaveLearningCourseQuizMutation,
  useSubmitMyLearningQuizAttemptMutation,
  useUpdateLearningCourseMutation,
  useUpdateLearningEnrollmentProgressMutation,
} from "@/src/store/services/learning";
import {
  useCreateCertificationMutation,
  useDeleteCertificationMutation,
  useGetMyCertificationsQuery,
  useUpdateCertificationMutation,
} from "@/src/store/services/certifications";
import type { Course, CourseQuiz, Enrollment, NewCourse } from "@/src/lib/types/learning";
import type { CertificationRecord } from "@/src/lib/certifications/status";

/** Courses, enrollments and certificates from the API; null signed out. */
export function useLiveLearning() {
  const live = useIsLive();
  const coursesQ = useGetAllLearningCoursesQuery(undefined, { skip: !live });
  const enrollmentsQ = useGetAllLearningEnrollmentsQuery(undefined, { skip: !live });
  const certsQ = useGetAllCertificationsQuery(undefined, { skip: !live });
  return useMemo(
    () => ({
      live,
      courses: coursesQ.data ? coursesQ.data.map(courseFromApi) : null,
      enrollments: enrollmentsQ.data ? enrollmentsQ.data.map(enrollmentFromApi) : null,
      certifications: certsQ.data ? certsQ.data.map(certificationFromApi) : null,
      loading: live && (coursesQ.isLoading || enrollmentsQ.isLoading),
    }),
    [live, coursesQ.data, enrollmentsQ.data, certsQ.data, coursesQ.isLoading, enrollmentsQ.isLoading],
  );
}

/** Sends the learning screens' changes to the API (no-ops signed out). */
export function useLearningActions() {
  const live = useIsLive();
  const send = useLiveSender(["Learning"]);
  const sendCert = useLiveSender(["Certifications"]);
  const [createCourse] = useCreateLearningCourseMutation();
  const [updateCourse] = useUpdateLearningCourseMutation();
  const [deleteCourse] = useDeleteLearningCourseMutation();
  const [saveQuiz] = useSaveLearningCourseQuizMutation();
  const [loadQuiz] = useLazyGetLearningCourseQuizQuery();
  const [enroll] = useEnrollInLearningCourseMutation();
  const [deleteEnrollment] = useDeleteLearningEnrollmentMutation();
  const [createCert] = useCreateCertificationMutation();
  const [updateCert] = useUpdateCertificationMutation();
  const [deleteCert] = useDeleteCertificationMutation();
  const done = Promise.resolve(true);

  return useMemo(() => {
    const on = (id: string) => live && isServerId(id);
    return {
      live,
      saveCourse: (data: NewCourse, existingId?: string) => {
        if (!live) return done;
        const body = courseToRequest(data);
        if (existingId && isServerId(existingId)) {
          return send(async () => {
            await updateCourse({ id: existingId, body }).unwrap();
            if (data.quiz?.questions.length) {
              await saveQuiz({ id: existingId, body: quizToRequest(data.quiz) }).unwrap();
            }
          }, "Could not save the course.");
        }
        return send(async () => {
          const created = await createCourse(body).unwrap();
          if (data.quiz?.questions.length) {
            await saveQuiz({ id: created.data.course.id, body: quizToRequest(data.quiz) }).unwrap();
          }
        }, "Could not create the course.");
      },
      deleteCourse: (id: string) =>
        on(id) ? send(() => deleteCourse(id).unwrap(), "Could not delete the course.") : done,
      saveQuiz: (courseId: string, quiz: CourseQuiz) =>
        on(courseId)
          ? send(() => saveQuiz({ id: courseId, body: quizToRequest(quiz) }).unwrap(), "Could not save the quiz.")
          : done,
      /** The course with its quiz questions read from the API. */
      withQuiz: async (course: Course): Promise<Course> => {
        if (!on(course.id) || !course.quiz) return course;
        try {
          const res = await loadQuiz(course.id).unwrap();
          const row = {
            passingScore: course.quiz.passingScore,
            maxAttempts: course.quiz.maxAttempts ?? null,
          } as Parameters<typeof quizFromApi>[0];
          return { ...course, quiz: quizFromApi(row, res.data) };
        } catch {
          return course;
        }
      },
      assign: (courseId: string, employeeIds: string[], dueDate?: string) =>
        on(courseId)
          ? send(
              () =>
                enroll({
                  id: courseId,
                  body: { employeeIds: employeeIds.filter(isServerId), dueOn: dueDate || null },
                }).unwrap(),
              "Could not assign the course.",
            )
          : done,
      deleteEnrollment: (id: string) =>
        on(id) ? send(() => deleteEnrollment(id).unwrap(), "Could not remove the enrolment.") : done,
      saveCertification: (c: CertificationRecord) => {
        if (!live) return done;
        const body = certificationToRequest(c);
        return isServerId(c.id)
          ? sendCert(() => updateCert({ id: c.id, body }).unwrap(), "Could not save the certificate.")
          : sendCert(() => createCert(body).unwrap(), "Could not add the certificate.");
      },
      deleteCertification: (id: string) =>
        on(id) ? sendCert(() => deleteCert(id).unwrap(), "Could not delete the certificate.") : done,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, send, sendCert]);
}

export type { Enrollment };

/** The shape of a row on the employee "My Learning" page. */
export interface MyLearningRow {
  id: string;
  courseId: string;
  courseName: string;
  category: Course["category"];
  status: Enrollment["status"];
  progress: number;
  enrolledAt: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  durationHours: number;
  instructor: string;
  deliveryMode: string;
  videoUrl?: string;
  lastPositionSeconds?: number;
  quizAttempts?: Enrollment["quizAttempts"];
  quizPassed?: boolean;
}

/** The signed-in employee's enrolments and the course library. */
export function useMyLearning() {
  const live = useIsLive();
  const q = useGetMyLearningQuery(undefined, { skip: !live });
  const certsQ = useGetMyCertificationsQuery(undefined, { skip: !live });
  return useMemo(() => {
    const dto = q.data?.data;
    if (!dto) return { live, rows: null, courses: null, certifications: null };
    const courses = dto.library.map(courseFromApi);
    const byId = new Map(courses.map((c) => [c.id, c]));
    const rows: MyLearningRow[] = dto.enrolled.map((e) => {
      const en = enrollmentFromApi(e);
      const course = byId.get(e.courseId);
      return {
        id: e.id,
        courseId: e.courseId,
        courseName: e.courseTitle,
        category: course?.category ?? "technical",
        status: en.status,
        progress: e.progress,
        enrolledAt: en.enrolledDate ?? "",
        dueDate: en.dueDate,
        completedAt: en.completedAt,
        score: en.score,
        durationHours: course?.durationHours ?? 0,
        instructor: course?.instructor ?? "",
        deliveryMode: course?.deliveryMode ?? "online",
        videoUrl: course?.videoUrl,
        lastPositionSeconds: e.resumeSeconds ?? undefined,
        quizAttempts: en.quizAttempts,
        quizPassed: e.quizPassed,
      };
    });
    return {
      live,
      rows,
      courses,
      certifications: certsQ.data?.data ? certsQ.data.data.map(certificationFromApi) : [],
    };
  }, [live, q.data, certsQ.data]);
}

/** The employee's own learning writes. */
export function useMyLearningActions() {
  const live = useIsLive();
  const myId = useMyEmployeeId();
  const send = useLiveSender(["Learning"]);
  const [enroll] = useEnrollInLearningCourseMutation();
  const [progress] = useUpdateLearningEnrollmentProgressMutation();
  const [loadQuiz] = useLazyGetMyLearningQuizQuery();
  const [attempt] = useSubmitMyLearningQuizAttemptMutation();
  const done = Promise.resolve(true);

  return useMemo(
    () => ({
      live,
      enroll: (courseId: string) =>
        live && isServerId(courseId) && myId
          ? send(() => enroll({ id: courseId, body: { employeeIds: [myId] } }).unwrap(), "Could not enrol you.")
          : done,
      progress: (enrollmentId: string, percent: number, resumeSeconds?: number) =>
        live && isServerId(enrollmentId)
          ? send(
              () =>
                progress({
                  enrollmentId,
                  body: { progress: Math.round(percent), resumeSeconds: resumeSeconds ?? null },
                }).unwrap(),
              "Could not save your progress.",
            )
          : done,
      /** The quiz as the server asks it (no answers): `correctIndex` is -1. */
      quiz: async (enrollmentId: string): Promise<CourseQuiz | null> => {
        if (!live || !isServerId(enrollmentId)) return null;
        try {
          const res = await loadQuiz(enrollmentId).unwrap();
          const q = res.data;
          return {
            passingScore: q.passingScore,
            // The server enforces the attempt limit (and reports it on the
            // enrolment after each attempt), so none is applied here.
            maxAttempts: undefined,
            questions: [...q.questions]
              .sort((a, b) => a.sequence - b.sequence)
              .map((x) => ({
                id: x.id,
                type: x.questionKind === "trueFalse" ? "true_false" : "mcq",
                prompt: x.prompt,
                options: x.options,
                correctIndex: -1,
                points: x.points,
              })),
          };
        } catch {
          return null;
        }
      },
      /** Grades on the server; resolves the score, or null when refused. */
      attempt: async (
        enrollmentId: string,
        answers: Record<string, number>,
      ): Promise<{ score: number; passed: boolean } | null> => {
        let result: { score: number; passed: boolean } | null = null;
        const ok = await send(async () => {
          const res = await attempt({ enrollmentId, body: { answers } }).unwrap();
          const scored = res.data.scored;
          if (scored) result = { score: Math.round(scored.score), passed: scored.passed };
        }, "Could not submit your answers.");
        return ok ? result : null;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, myId, send],
  );
}
