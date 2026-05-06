import { Award, Star } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
} from "@/src/data/learning-demo";
import type { MyEnrollment } from "./data";
import { formatDate } from "./helpers";

interface HistoryTabProps {
  completedCourses: MyEnrollment[];
  totalHoursCompleted: number;
  onViewCertificate: (e: MyEnrollment) => void;
}

export function HistoryTab({
  completedCourses,
  totalHoursCompleted,
  onViewCertificate,
}: HistoryTabProps) {
  const withScore = completedCourses.filter((e) => e.score !== undefined);
  const avgScore =
    withScore.length > 0
      ? Math.round(
          withScore.reduce((sum, e) => sum + (e.score ?? 0), 0) /
            withScore.length,
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted w-fit">
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
            {avgScore !== null ? `${avgScore}%` : "—"}
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewCertificate(enrollment)}
                  >
                    <Award className="w-3.5 h-3.5 mr-1.5" />
                    Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
