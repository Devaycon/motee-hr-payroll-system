import { Play, Video, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import type { MyEnrollment } from "./data";
import { ProgressBar } from "./helpers";

interface PlayerModalProps {
  open: boolean;
  enrollment: MyEnrollment | null;
  playerProgress: number;
  playerPlaying: boolean;
  onTogglePlay: () => void;
  onSaveProgress: () => void;
  onClose: () => void;
}

export function PlayerModal({
  open,
  enrollment,
  playerProgress,
  playerPlaying,
  onTogglePlay,
  onSaveProgress,
  onClose,
}: PlayerModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {enrollment?.courseName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-900 aspect-video flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {enrollment?.deliveryMode === "online" ? (
                <Video className="w-16 h-16 text-slate-600" />
              ) : (
                <FileText className="w-16 h-16 text-slate-600" />
              )}
            </div>
            <button
              onClick={onTogglePlay}
              className="relative z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              {playerPlaying ? (
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-5 bg-white rounded-sm" />
                  <div className="w-1.5 h-5 bg-white rounded-sm" />
                </div>
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </button>
            <p className="relative z-10 text-white/60 text-xs">
              {playerPlaying ? "Playing..." : "Click to play"}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">
                {Math.round(playerProgress)}%
              </span>
            </div>
            <ProgressBar value={playerProgress} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button
              className="flex-1 text-white bg-[#4361ee] hover:bg-[#3451d1]"
              onClick={onSaveProgress}
            >
              Save Progress & Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
