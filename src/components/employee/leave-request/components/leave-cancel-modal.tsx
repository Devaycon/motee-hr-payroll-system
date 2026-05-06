"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";

interface LeaveCancelModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveCancelModal({
  open,
  onClose,
  onConfirm,
}: LeaveCancelModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Cancel Leave Request?
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          This action cannot be undone. Your leave request will be marked as
          cancelled.
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onClose}
          >
            Keep
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
          >
            Yes, Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
