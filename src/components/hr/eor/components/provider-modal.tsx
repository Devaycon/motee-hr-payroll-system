"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { toast } from "sonner";
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
import { getInitials } from "@/src/lib/types/dashboard";
import type { EorProvider } from "../types";

const schema = z.object({
  name: z.string().min(2, "Provider name is required"),
  status: z.string().min(1, "Select a status"),
  managementFeePct: z.coerce
    .number()
    .min(0, "Fee must be 0 or more")
    .max(100, "Fee can't exceed 100%"),
  since: z.string().min(1, "Partnership date is required"),
  website: z.string().optional(),
  countries: z.string().optional(),
});

type FormState = {
  name: string;
  status: string;
  managementFeePct: string;
  since: string;
  website: string;
  countries: string;
};

const EMPTY: FormState = {
  name: "",
  status: "active",
  managementFeePct: "9",
  since: "",
  website: "",
  countries: "",
};

interface ProviderModalProps {
  open: boolean;
  onClose: () => void;
  editingProvider: EorProvider | null;
  onSave: (provider: EorProvider) => void;
}

export function ProviderModal({
  open,
  onClose,
  editingProvider,
  onSave,
}: ProviderModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setForm(
        editingProvider
          ? {
              name: editingProvider.name,
              status: editingProvider.status,
              managementFeePct: String(editingProvider.managementFeePct),
              since: editingProvider.since,
              website: editingProvider.website ?? "",
              countries: editingProvider.countriesCovered.join(", "),
            }
          : EMPTY,
      );
      setErrors({});
    }
  }

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSave() {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const v = result.data;
    const countriesCovered = (v.countries ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const provider: EorProvider = {
      id: editingProvider?.id ?? `eorp-${Date.now()}`,
      name: v.name.trim(),
      initials: getInitials(v.name),
      status: v.status as EorProvider["status"],
      countriesCovered,
      workerCount: editingProvider?.workerCount ?? 0,
      managementFeePct: v.managementFeePct,
      since: v.since,
      website: v.website?.trim() || undefined,
    };

    onSave(provider);
    toast.success(editingProvider ? "Provider updated." : `${provider.name} added.`);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {editingProvider ? "Edit Provider" : "Add EOR Provider"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Provider name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Deel"
              className="h-9 text-sm"
            />
            {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-sm">Active</SelectItem>
                  <SelectItem value="inactive" className="text-sm">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Management fee (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.managementFeePct}
                onChange={(e) => set("managementFeePct", e.target.value)}
                className="h-9 text-sm"
              />
              {errors.managementFeePct && (
                <p className="text-[10px] text-destructive">{errors.managementFeePct}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Partner since</Label>
              <Input
                type="date"
                value={form.since}
                onChange={(e) => set("since", e.target.value)}
                className="h-9 text-sm"
              />
              {errors.since && <p className="text-[10px] text-destructive">{errors.since}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Countries covered</Label>
            <Textarea
              value={form.countries}
              onChange={(e) => set("countries", e.target.value)}
              placeholder="Comma-separated, e.g. United States, United Kingdom, Germany"
              className="text-sm resize-none min-h-16"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {editingProvider ? "Save Changes" : "Add Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
