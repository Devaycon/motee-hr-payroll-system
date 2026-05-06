import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
  DELIVERY_MODE_LABELS,
} from "@/src/data/learning-demo";
import type { Course } from "./data";
import { formatDate } from "./helpers";

interface CourseDetailModalProps {
  open: boolean;
  course: Course | null;
  isEnrolled: boolean;
  onClose: () => void;
  onEnroll: (c: Course) => void;
}

export function CourseDetailModal({
  open,
  course,
  isEnrolled,
  onClose,
  onEnroll,
}: CourseDetailModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{course?.title}</DialogTitle>
        </DialogHeader>
        {course && (
          <div className="space-y-4">
            <Badge
              className={`text-xs ${COURSE_CATEGORY_STYLES[course.category]}`}
            >
              {COURSE_CATEGORY_LABELS[course.category]}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {course.description}
            </p>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">
                  {course.durationHours} hours
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivery Mode</p>
                <p className="font-medium text-foreground">
                  {DELIVERY_MODE_LABELS[course.deliveryMode]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Instructor</p>
                <p className="font-medium text-foreground">
                  {course.instructor}
                </p>
              </div>
              {course.capacity && (
                <div>
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="font-medium text-foreground">
                    {course.enrolled ?? 0} / {course.capacity}
                  </p>
                </div>
              )}
              {course.startDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">
                    {formatDate(course.startDate)}
                  </p>
                </div>
              )}
              {course.endDate && (
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium text-foreground">
                    {formatDate(course.endDate)}
                  </p>
                </div>
              )}
            </div>
            {course.tags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
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
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              {!isEnrolled && (
                <Button
                  className="flex-1 text-white bg-[#4361ee] hover:bg-[#3451d1]"
                  onClick={() => {
                    onClose();
                    onEnroll(course);
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
  );
}
