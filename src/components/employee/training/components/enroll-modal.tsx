import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { DELIVERY_MODE_LABELS } from "@/src/data/learning-demo";
import type { Course } from "./data";

interface EnrollModalProps {
  open: boolean;
  course: Course | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function EnrollModal({
  open,
  course,
  onConfirm,
  onClose,
}: EnrollModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Confirm Enrolment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You are about to enrol in:
          </p>
          <p className="font-semibold text-foreground text-sm">
            {course?.title}
          </p>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{course?.durationHours}h</span>
            <span>•</span>
            <span>
              {course ? DELIVERY_MODE_LABELS[course.deliveryMode] : ""}
            </span>
            <span>•</span>
            <span>{course?.instructor}</span>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 text-white bg-[#4361ee] hover:bg-[#3451d1]"
              onClick={onConfirm}
            >
              Confirm Enrolment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
