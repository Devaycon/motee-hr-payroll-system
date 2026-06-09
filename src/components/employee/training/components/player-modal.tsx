"use client";

import { useRef, useState } from "react";
import { CheckCircle2, VideoOff } from "lucide-react";
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
  /** Persist watched progress (percent 0–100) and resume position (seconds). */
  onSaveProgress: (percent: number, positionSeconds: number) => void;
  /** Mark the training fully watched/completed. */
  onComplete: () => void;
  onClose: () => void;
}

/** Treat the video as finished a touch before the exact end to avoid rounding gaps. */
const COMPLETE_THRESHOLD = 99;

export function PlayerModal({
  open,
  enrollment,
  onSaveProgress,
  onComplete,
  onClose,
}: PlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [percent, setPercent] = useState(enrollment?.progress ?? 0);
  const [position, setPosition] = useState(enrollment?.lastPositionSeconds ?? 0);
  const completedRef = useRef(false);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  // Seed the displayed progress/position whenever the modal opens for an enrollment.
  const activeKey = open && enrollment ? `${enrollment.id}` : null;
  if (activeKey !== openedFor) {
    setOpenedFor(activeKey);
    if (activeKey) {
      setPercent(enrollment!.progress);
      setPosition(enrollment!.lastPositionSeconds ?? 0);
    }
  }

  // Resume from the last watched position once metadata (duration) is known.
  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (!v) return;
    const resume = enrollment?.lastPositionSeconds ?? 0;
    if (resume > 0 && resume < v.duration) v.currentTime = resume;
    completedRef.current = false;
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
    setPercent(pct);
    setPosition(v.currentTime);
    if (pct >= COMPLETE_THRESHOLD && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }

  function handleSaveExit() {
    onSaveProgress(percent, position);
  }

  const hasVideo = Boolean(enrollment?.videoUrl);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{enrollment?.courseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {hasVideo ? (
            <video
              ref={videoRef}
              src={enrollment!.videoUrl}
              controls
              playsInline
              className="w-full aspect-video rounded-lg bg-black"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                  onComplete();
                }
              }}
            />
          ) : (
            <div className="rounded-lg bg-slate-900 aspect-video flex flex-col items-center justify-center gap-2 text-slate-400">
              <VideoOff className="w-12 h-12" />
              <p className="text-xs">No video is available for this training yet.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{percent}%</span>
            </div>
            <ProgressBar value={percent} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            {hasVideo && percent < COMPLETE_THRESHOLD && (
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => {
                  completedRef.current = true;
                  onComplete();
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Mark as watched
              </Button>
            )}
            <Button
              className="flex-1 text-white bg-[#4361ee] hover:bg-[#3451d1]"
              onClick={handleSaveExit}
            >
              Save Progress &amp; Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
