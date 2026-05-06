import { TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import type { PerformanceGoal } from "@/src/lib/types/performance";
import { ProgressBar } from "./helpers";

interface ProgressUpdateModalProps {
  goal: PerformanceGoal | null;
  newProgress: string;
  progressNote: string;
  setNewProgress: (v: string) => void;
  setProgressNote: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ProgressUpdateModal({
  goal,
  newProgress,
  progressNote,
  setNewProgress,
  setProgressNote,
  onSave,
  onClose,
}: ProgressUpdateModalProps) {
  return (
    <Dialog open={!!goal} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        {goal && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-[#4361ee]/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#4361ee]" />
                </div>
                <DialogTitle className="text-sm font-semibold">
                  Update Progress
                </DialogTitle>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                {goal.goalTitle}
              </p>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Progress (%)</p>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    className="h-8 text-xs w-24"
                  />
                  <div className="flex-1">
                    <ProgressBar
                      value={Math.min(
                        100,
                        Math.max(0, Number(newProgress) || 0),
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  Update note{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </p>
                <Textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="What did you accomplish since the last update?"
                  className="text-xs min-h-16 resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#4361ee] hover:bg-[#3451d1] text-white"
                onClick={onSave}
              >
                Save
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

