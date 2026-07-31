"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import type { OffboardingRecord } from "../types";

interface DisapproveDialogProps {
  record: OffboardingRecord | null;
  onClose: () => void;
  onConfirm: (record: OffboardingRecord, reason: string) => void;
}

/** Captures why an exit was turned down (client feedback §2.2). */
export function DisapproveDialog({
  record,
  onClose,
  onConfirm,
}: DisapproveDialogProps) {
  const [reason, setReason] = useState("");
  const [prevId, setPrevId] = useState<string | null>(null);

  // Reset when a different record opens the dialog.
  if (record && record.id !== prevId) {
    setPrevId(record.id);
    setReason("");
  }

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disapprove Offboarding</DialogTitle>
          <DialogDescription>
            {record?.employeeName} will move to the Disapproved tab and stay on
            the workforce until the exit is reopened.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="disapproval-reason" className="text-xs">
            Reason
          </Label>
          <Textarea
            id="disapproval-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this exit being turned down?"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length < 3}
            onClick={() => record && onConfirm(record, reason.trim())}
          >
            Disapprove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleInterviewDialogProps {
  record: OffboardingRecord | null;
  onClose: () => void;
  onConfirm: (record: OffboardingRecord, date: string) => void;
}

/** Sets the exit-interview date, distinct from marking it complete. */
export function ScheduleInterviewDialog({
  record,
  onClose,
  onConfirm,
}: ScheduleInterviewDialogProps) {
  const [date, setDate] = useState("");
  const [prevId, setPrevId] = useState<string | null>(null);

  if (record && record.id !== prevId) {
    setPrevId(record.id);
    setDate(record.exitInterviewScheduledAt ?? "");
  }

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Exit Interview</DialogTitle>
          <DialogDescription>
            Pick a date for {record?.employeeName}&apos;s exit interview. Last
            working day is {record?.lastWorkingDate}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="interview-date" className="text-xs">
            Interview date
          </Label>
          <Input
            id="interview-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!date}
            onClick={() => record && onConfirm(record, date)}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
