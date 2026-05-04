"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

interface EditRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field?: string;
}

const FIELD_OPTIONS = [
  { value: "name", label: "Full Name" },
  { value: "dob", label: "Date of Birth" },
  { value: "bank_account", label: "Bank Account Details" },
  { value: "employee_id", label: "Employee ID" },
  { value: "other", label: "Other" },
];

export function EditRequestModal({
  open,
  onOpenChange,
  field,
}: EditRequestModalProps) {
  const [selectedField, setSelectedField] = useState(field ?? "");
  const [currentValue, setCurrentValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCurrentValue("");
      setNewValue("");
      setReason("");
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
              <Lock className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Request a Profile Change
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This field requires HR approval. Your request will be sent to HR for
            review.
          </p>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-[#1D9E75]">
              ✓ Request submitted
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              HR will review and update your profile shortly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Field to change</Label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((f) => (
                    <SelectItem
                      key={f.value}
                      value={f.value}
                      className="text-xs"
                    >
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Current value</Label>
              <Input
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="What it currently says"
                className="h-8 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Requested new value</Label>
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="What it should be changed to"
                className="h-8 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Reason for change</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why this change is needed..."
                className="text-xs min-h-17.5 resize-none"
              />
            </div>
          </div>
        )}

        {!submitted && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={handleSubmit}
              disabled={!selectedField || !newValue || !reason}
            >
              Submit Request
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
