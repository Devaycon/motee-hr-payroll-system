import { Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { MyEnrollment } from "./data";
import { formatDate } from "./helpers";

interface CertificateModalProps {
  open: boolean;
  enrollment: MyEnrollment | null;
  onClose: () => void;
}

export function CertificateModal({
  open,
  enrollment,
  onClose,
}: CertificateModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            Completion Certificate
          </DialogTitle>
        </DialogHeader>
        <div className="border-2 border-[#4361ee]/40 rounded-xl p-6 text-center space-y-3 bg-linear-to-b from-[#4361ee]/5 to-transparent">
          <Award className="w-12 h-12 mx-auto text-[#4361ee]" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Certificate of Completion
          </p>
          <p className="text-lg font-bold text-foreground">
            {enrollment?.courseName}
          </p>
          <p className="text-sm text-muted-foreground">
            Awarded to{" "}
            <span className="font-semibold text-foreground">Amaka Johnson</span>
          </p>
          {enrollment?.score !== undefined && (
            <p className="text-sm text-muted-foreground">
              Score:{" "}
              <span className="font-semibold text-foreground">
                {enrollment.score}%
              </span>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {enrollment?.completedAt
              ? formatDate(enrollment.completedAt)
              : formatDate(new Date().toISOString().split("T")[0])}
          </p>
        </div>
        <Button
          className="w-full text-white bg-[#4361ee] hover:bg-[#3451d1]"
          onClick={onClose}
        >
          Save to My Documents
        </Button>
      </DialogContent>
    </Dialog>
  );
}
