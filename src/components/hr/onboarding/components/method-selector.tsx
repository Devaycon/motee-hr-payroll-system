"use client";

import { ClipboardList, Mail, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";

export type OnboardingMethod = "manual" | "invite" | "bulk";

interface MethodSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (method: OnboardingMethod) => void;
}

const METHODS = [
  {
    key: "manual" as const,
    icon: ClipboardList,
    label: "Manual Entry",
    description:
      "Fill in the complete employee registration form step by step on their behalf.",
    color: "text-blue-500",
    bg: "bg-blue-500/10 hover:bg-blue-500/20",
    border: "border-blue-500/20",
  },
  {
    key: "invite" as const,
    icon: Mail,
    label: "Send Invite",
    description:
      "Email the employee an onboarding link to complete their own registration.",
    color: "text-violet-500",
    bg: "bg-violet-500/10 hover:bg-violet-500/20",
    border: "border-violet-500/20",
  },
  {
    key: "bulk" as const,
    icon: Upload,
    label: "Bulk Upload",
    description:
      "Upload a CSV file using our template to onboard multiple employees at once.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
    border: "border-emerald-500/20",
  },
];

export function MethodSelector({
  open,
  onClose,
  onSelect,
}: MethodSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">
            Initiate Onboarding
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose how you&apos;d like to add new employees.
          </p>
        </DialogHeader>
        <div className="px-6 py-5 flex flex-col gap-3">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onSelect(m.key)}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl border text-left transition-colors",
                  m.bg,
                  m.border,
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/60 shrink-0">
                  <Icon className={cn("w-5 h-5", m.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
