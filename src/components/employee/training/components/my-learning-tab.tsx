import { AlertTriangle, Clock, Play, CalendarPlus, Eye, CircleDashed } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_STYLES,
  DELIVERY_MODE_LABELS,
} from "@/src/data/learning-demo";
import { formatDate } from "@/src/lib/utils/format-date";
import type { MyEnrollment } from "./data";
import { daysUntil, ProgressBar } from "./helpers";

interface MyLearningTabProps {
  enrollments: MyEnrollment[];
  onOpenPlayer: (e: MyEnrollment) => void;
}

/** Watched / partially watched / not started, derived from progress. */
function watchedLabel(progress: number): { label: string; className: string } {
  if (progress >= 99) return { label: "Watched", className: "text-emerald-600" };
  if (progress > 0) return { label: `Watched ${progress}%`, className: "text-amber-600" };
  return { label: "Not started", className: "text-muted-foreground" };
}

function TrainingCard({
  enrollment,
  onOpenPlayer,
}: {
  enrollment: MyEnrollment;
  onOpenPlayer: (e: MyEnrollment) => void;
}) {
  const due = enrollment.dueDate ? daysUntil(enrollment.dueDate) : null;
  const isOverdue = due !== null && due < 0;
  const isDueSoon = due !== null && due >= 0 && due <= 7;
  const watched = watchedLabel(enrollment.progress);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <Badge className={`text-xs ${COURSE_CATEGORY_STYLES[enrollment.category]}`}>
              {COURSE_CATEGORY_LABELS[enrollment.category]}
            </Badge>
            <p className="font-semibold text-sm text-foreground leading-snug">
              {enrollment.courseName}
            </p>
          </div>
          <Badge className={`text-xs shrink-0 ${ENROLLMENT_STATUS_STYLES[enrollment.status]}`}>
            {ENROLLMENT_STATUS_LABELS[enrollment.status]}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              {enrollment.progress >= 99 ? (
                <Eye className="w-3 h-3" />
              ) : (
                <CircleDashed className="w-3 h-3" />
              )}
              <span className={watched.className}>{watched.label}</span>
            </span>
            <span className="font-medium text-foreground">{enrollment.progress}%</span>
          </div>
          <ProgressBar value={enrollment.progress} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
          {enrollment.enrolledAt && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarPlus className="w-3 h-3" />
                Assigned {formatDate(enrollment.enrolledAt)}
              </span>
            </>
          )}
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
                Due {formatDate(enrollment.dueDate)}
                {isOverdue
                  ? ` (${Math.abs(due!)}d overdue)`
                  : due !== null
                    ? ` (in ${due}d)`
                    : ""}
              </span>
            </>
          )}
        </div>

        <Button
          size="sm"
          className="w-full text-white bg-[#4361ee] hover:bg-[#3451d1]"
          onClick={() => onOpenPlayer(enrollment)}
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {enrollment.status === "enrolled" ? "Start Course" : "Continue"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function MyLearningTab({ enrollments, onOpenPlayer }: MyLearningTabProps) {
  const activeCourses = enrollments.filter(
    (e) => e.status === "enrolled" || e.status === "in_progress",
  );
  const overdueCourses = activeCourses.filter(
    (e) => e.dueDate && daysUntil(e.dueDate) < 0,
  );

  // Organised by status: not-yet-started ("Assigned") then "In Progress".
  const groups: { key: string; label: string; items: MyEnrollment[] }[] = [
    { key: "enrolled", label: "Assigned", items: activeCourses.filter((e) => e.status === "enrolled") },
    { key: "in_progress", label: "In Progress", items: activeCourses.filter((e) => e.status === "in_progress") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
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
        groups.map((group) => (
          <div key={group.key} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label} ({group.items.length})
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map((enrollment) => (
                <TrainingCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onOpenPlayer={onOpenPlayer}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
