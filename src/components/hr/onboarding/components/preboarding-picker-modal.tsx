"use client";

import { ChevronRight, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Badge } from "@/src/components/ui/badge";
import type { OnboardingRecord } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  records: OnboardingRecord[];
  onPick: (id: string) => void;
}

export function PreboardingPickerModal({ open, onClose, records, onPick }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            Continue from Preboarding
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pick a preboarding hire — their captured details will prefill the onboarding form.
          </p>
        </DialogHeader>
        <div className="px-4 py-4">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <UserPlus className="w-6 h-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No preboarding hires yet. Initiate one from the Preboarding tab first.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-1.5">
                {records.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onPick(r.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                      {r.employeeInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.employeeName}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {r.email || "—"}
                        {r.assets && r.assets.length > 0
                          ? ` · ${r.assets.length} asset${r.assets.length > 1 ? "s" : ""}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-600 shrink-0"
                    >
                      Preboarding
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
