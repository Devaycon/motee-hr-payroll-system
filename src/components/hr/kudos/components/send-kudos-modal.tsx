"use client";

import { z } from "zod/v4";
import { useState } from "react";
import { Star } from "lucide-react";
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
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  KUDOS_TYPE_CONFIG,
  KUDOS_TYPE_OPTIONS,
  COMPANY_VALUE_CONFIG,
  EMPLOYEE_ROSTER,
} from "../data";
import type { KudosType, CompanyValue, NewKudos } from "../types";

const schema = z.object({
  recipientName: z.string().min(1, { message: "Please select a recipient" }),
  kudosType: z.string().min(1, { message: "Please select a kudos type" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(500, { message: "Message cannot exceed 500 characters" }),
  customTypeName: z.string().optional(),
});

type FormValues = {
  recipientName: string;
  recipientInitials: string;
  recipientDept: string;
  kudosType: KudosType | "";
  customTypeName: string;
  companyValue: CompanyValue | "";
  message: string;
  isPrivate: boolean;
  isBroadcast: boolean;
};

function getDefaults(recipient?: KudosRecipient): FormValues {
  return {
    recipientName: recipient?.name ?? "",
    recipientInitials: recipient?.initials ?? "",
    recipientDept: recipient?.department ?? "",
    kudosType: "",
    customTypeName: "",
    companyValue: "",
    message: "",
    isPrivate: false,
    isBroadcast: false,
  };
}

/** Pre-selects the recipient, e.g. when opened from an employee row. */
export interface KudosRecipient {
  name: string;
  initials: string;
  department: string;
}

interface SendKudosModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewKudos) => void;
  recipient?: KudosRecipient;
}

export function SendKudosModal({
  open,
  onClose,
  onSave,
  recipient,
}: SendKudosModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(() => getDefaults());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(getDefaults(recipient));
      setErrors({});
    }
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleRecipientSelect(name: string) {
    const found = EMPLOYEE_ROSTER.find((e) => e.name === name);
    if (found) {
      setForm((prev) => ({
        ...prev,
        recipientName: found.name,
        recipientInitials: found.initials,
        recipientDept: found.dept,
      }));
      setErrors((prev) => ({ ...prev, recipientName: undefined }));
    }
  }

  function handleSave() {
    const result = schema.safeParse({
      recipientName: form.recipientName,
      kudosType: form.kudosType,
      message: form.message,
      customTypeName: form.customTypeName || undefined,
    });

    if (!result.success) {
      const fieldErrors: Partial<Record<string, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    onSave({
      recipientName: form.recipientName,
      recipientInitials: form.recipientInitials,
      recipientDept: form.recipientDept,
      kudosType: form.kudosType as KudosType,
      customTypeName:
        form.kudosType === "custom"
          ? form.customTypeName || undefined
          : undefined,
      companyValue: (form.companyValue ||
        "integrity") as import("@/src/lib/types/kudos").CompanyValue,
      message: form.message.trim(),
      isPublic: !form.isPrivate,
      isPrivate: form.isPrivate,
      isBroadcast: form.isBroadcast,
    });
  }

  const charCount = form.message.length;
  const selectedEmployee = EMPLOYEE_ROSTER.find(
    (e) => e.name === form.recipientName,
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            Send Kudos
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recognise a colleague for their outstanding contribution
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-5 pb-4">
            <div className="space-y-1.5">
              <Label>Recipient</Label>
              <Select
                value={form.recipientName}
                onValueChange={handleRecipientSelect}
              >
                <SelectTrigger>
                  {selectedEmployee ? (
                    <div className="flex items-center gap-2">
                      <PersonAvatar
                        name={selectedEmployee.name}
                        initials={selectedEmployee.initials}
                        className="size-5"
                        fallbackClassName="text-[9px] font-bold bg-primary/10 text-primary"
                      />
                      <span className="text-sm">{selectedEmployee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        · {selectedEmployee.dept}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select a colleague..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_ROSTER.map((e) => (
                    <SelectItem key={e.name} value={e.name}>
                      <div className="flex items-center gap-2">
                        <PersonAvatar
                          name={e.name}
                          initials={e.initials}
                          className="size-5"
                          fallbackClassName="text-[9px] font-bold bg-primary/10 text-primary"
                        />
                        <span>{e.name}</span>
                        <span className="text-xs text-muted-foreground">
                          · {e.dept}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.recipientName && (
                <p className="text-xs text-destructive">
                  {errors.recipientName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Recognition Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {KUDOS_TYPE_OPTIONS.map((type) => {
                  const cfg = KUDOS_TYPE_CONFIG[type];
                  const selected = form.kudosType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set("kudosType", type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        selected
                          ? `${cfg.bg} ${cfg.border} border-2 shadow-sm`
                          : "bg-background border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <cfg.icon
                        className={`size-5 ${selected ? cfg.color : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-[10px] font-semibold text-center leading-tight ${selected ? cfg.color : "text-muted-foreground"}`}
                      >
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.kudosType && (
                <p className="text-xs text-destructive">{errors.kudosType}</p>
              )}
            </div>

            {form.kudosType === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-type">Custom Type Name</Label>
                <Input
                  id="custom-type"
                  placeholder="e.g. Go-Getter, Problem Magnet..."
                  value={form.customTypeName}
                  onChange={(e) => set("customTypeName", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Company Value (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.entries(COMPANY_VALUE_CONFIG) as [
                    CompanyValue,
                    { label: string; color: string; bg: string },
                  ][]
                ).map(([value, cfg]) => {
                  const selected = form.companyValue === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("companyValue", selected ? "" : value)}
                      className="transition-all"
                    >
                      <Badge
                        variant="outline"
                        className={`cursor-pointer transition-all text-xs ${
                          selected
                            ? `${cfg.bg} ${cfg.color} border-current shadow-sm`
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {cfg.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="kudos-message">Message</Label>
                <span
                  className={`text-xs ${charCount > 480 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {charCount}/500
                </span>
              </div>
              <Textarea
                id="kudos-message"
                placeholder="Write a heartfelt recognition message..."
                rows={4}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                maxLength={500}
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Team Broadcast</Label>
                  <p className="text-xs text-muted-foreground">
                    Pin this to the top of the feed for everyone to see
                  </p>
                </div>
                <Switch
                  checked={form.isBroadcast}
                  onCheckedChange={(v) => set("isBroadcast", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Private Kudos</Label>
                  <p className="text-xs text-muted-foreground">
                    Only visible to the recipient and HR admins
                  </p>
                </div>
                <Switch
                  checked={form.isPrivate}
                  onCheckedChange={(v) => set("isPrivate", v)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Send Kudos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
