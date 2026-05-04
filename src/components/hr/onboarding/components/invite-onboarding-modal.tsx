"use client";

import { useState } from "react";
import { z } from "zod";
import { Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DEPARTMENT_OPTIONS } from "../data";
import type { InviteOnboardingData } from "../types";

const formSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Valid email required"),
  jobTitle: z.string().min(2, "At least 2 characters"),
  department: z.string().min(1, "Required"),
  startDate: z.string().min(1, "Required"),
});

type FormFields = z.infer<typeof formSchema>;
type TouchedFields = Partial<Record<keyof FormFields, boolean>>;

const EMPTY: FormFields = {
  firstName: "",
  lastName: "",
  email: "",
  jobTitle: "",
  department: "",
  startDate: "",
};

interface InviteOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onSend: (data: InviteOnboardingData) => void;
}

export function InviteOnboardingModal({
  open,
  onClose,
  onSend,
}: InviteOnboardingModalProps) {
  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [touched, setTouched] = useState<TouchedFields>({});

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setFields(EMPTY);
      setTouched({});
    }
  }

  const result = formSchema.safeParse(fields);

  const fieldError = (key: keyof FormFields): string | null => {
    if (!touched[key] || result.success) return null;
    return result.error.issues.find((i) => i.path[0] === key)?.message ?? null;
  };

  const touch = (key: keyof FormFields) =>
    setTouched((p) => ({ ...p, [key]: true }));

  const set = <K extends keyof FormFields>(key: K, value: string) =>
    setFields((p) => ({ ...p, [key]: value }));

  const handleSend = () => {
    const allTouched = Object.fromEntries(
      Object.keys(EMPTY).map((k) => [k, true]),
    ) as TouchedFields;
    setTouched(allTouched);
    if (!result.success) return;
    onSend(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 shrink-0">
              <Mail className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Send Onboarding Invite
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                The employee will receive a link to complete their own
                registration.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">First Name</Label>
            <Input
              placeholder="John"
              value={fields.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              onBlur={() => touch("firstName")}
              className="h-8 text-sm"
            />
            {fieldError("firstName") && (
              <p className="text-xs text-destructive">
                {fieldError("firstName")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Last Name</Label>
            <Input
              placeholder="Doe"
              value={fields.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              onBlur={() => touch("lastName")}
              className="h-8 text-sm"
            />
            {fieldError("lastName") && (
              <p className="text-xs text-destructive">
                {fieldError("lastName")}
              </p>
            )}
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Work Email Address</Label>
            <Input
              type="email"
              placeholder="john.doe@company.com"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => touch("email")}
              className="h-8 text-sm"
            />
            {fieldError("email") && (
              <p className="text-xs text-destructive">{fieldError("email")}</p>
            )}
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Job Title</Label>
            <Input
              placeholder="e.g. Software Engineer"
              value={fields.jobTitle}
              onChange={(e) => set("jobTitle", e.target.value)}
              onBlur={() => touch("jobTitle")}
              className="h-8 text-sm"
            />
            {fieldError("jobTitle") && (
              <p className="text-xs text-destructive">
                {fieldError("jobTitle")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Department</Label>
            <Select
              value={fields.department}
              onValueChange={(v) => {
                set("department", v);
                touch("department");
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d} className="text-sm">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("department") && (
              <p className="text-xs text-destructive">
                {fieldError("department")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Expected Start Date</Label>
            <Input
              type="date"
              value={fields.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              onBlur={() => touch("startDate")}
              className="h-8 text-sm"
            />
            {fieldError("startDate") && (
              <p className="text-xs text-destructive">
                {fieldError("startDate")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleSend}
          >
            <Mail className="w-3.5 h-3.5" />
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
