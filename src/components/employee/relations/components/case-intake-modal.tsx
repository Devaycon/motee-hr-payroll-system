"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
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
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { CASE_TYPE_OPTIONS, PRIORITY_OPTIONS } from "./data";
import type { NewERCase } from "./data";

const intakeSchema = z.object({
  complaintType: z.string().min(1, { message: "Please select a case type." }),
  incidentDate: z.string().optional(),
  description: z
    .string()
    .min(20, {
      message: "Please describe what happened in at least 20 characters.",
    }),
  priority: z.string().min(1, { message: "Priority is required." }),
});

type FormErrors = Partial<Record<string, string>>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Restricted subset of `NewERCase` — no employee picker, no Assigned To. */
  onCreate: (
    data: Pick<
      NewERCase,
      "complaintType" | "incidentDate" | "description" | "priority"
    >,
  ) => void;
}

export function CaseIntakeModal({ open, onClose, onCreate }: Props) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [complaintType, setComplaintType] = useState("grievance");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Reset the form each time the modal opens, mirroring the HR admin form's
  // "adjust state during render" pattern rather than an effect.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setComplaintType("grievance");
      setIncidentDate("");
      setDescription("");
      setPriority("medium");
      setErrors({});
    }
  }

  function validate(): boolean {
    const result = intakeSchema.safeParse({
      complaintType,
      incidentDate,
      description,
      priority,
    });
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      onCreate({
        complaintType: complaintType as NewERCase["complaintType"],
        incidentDate: incidentDate || undefined,
        description,
        priority: priority as NewERCase["priority"],
      });
      toast.success("Case submitted. HR will review it confidentially.");
      setLoading(false);
      onClose();
    }, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v: boolean) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise a Case</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Cases you raise here are handled confidentially by HR, seen only
            by the people who need to work on it. Take your time and include
            as much detail as you can — it helps HR act on this quickly.
          </p>
        </div>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Case Type</Label>
              <Select value={complaintType} onValueChange={setComplaintType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.complaintType && (
                <p className="text-xs text-destructive">
                  {errors.complaintType}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="incident-date">Incident Date</Label>
            <Input
              id="incident-date"
              type="date"
              value={incidentDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIncidentDate(e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional — leave blank if this is ongoing or you&apos;re not
              sure.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">What happened?</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the incident or concern in as much detail as you're able to..."
              rows={5}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
