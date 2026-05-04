"use client";

import { useState } from "react";
import { z } from "zod";
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
import { Switch } from "@/src/components/ui/switch";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";
import { Textarea } from "@/src/components/ui/textarea";
import {
  CONTRACT_TYPE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  DEPARTMENT_OPTIONS,
  CURRENCY_OPTIONS,
} from "../data";
import type {
  Contract,
  ContractType,
  ContractStatus,
  NewContract,
} from "../types";

const contractSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
  contractType: z.enum(
    [
      "employment",
      "nda",
      "contractor",
      "internship",
      "consultancy",
      "amendment",
    ],
    { message: "Contract type is required." },
  ),
  status: z.enum(
    [
      "draft",
      "pending_signature",
      "active",
      "expiring_soon",
      "expired",
      "terminated",
    ],
    { message: "Status is required." },
  ),
  employeeName: z
    .string()
    .min(2, { message: "Employee name must be at least 2 characters." }),
  employeeInitials: z
    .string()
    .min(1, { message: "Initials required." })
    .max(3, { message: "Max 3 characters." }),
  department: z.string().min(1, { message: "Department is required." }),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().optional(),
  autoRenew: z.boolean(),
  noticePeriodDays: z.coerce
    .number({ message: "Notice period must be a number." })
    .min(0, { message: "Cannot be negative." }),
  salary: z.coerce
    .number()
    .positive({ message: "Must be a positive number." })
    .optional()
    .or(z.literal("")),
  contractCurrency: z.string().min(1, { message: "Currency is required." }),
});

type FormErrors = Partial<Record<keyof NewContract, string>>;

interface ContractFormModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onSave: (data: NewContract) => void;
}

const EMPTY: NewContract = {
  title: "",
  description: "",
  contractType: "employment",
  status: "draft",
  employeeName: "",
  employeeInitials: "",
  department: "",
  startDate: "",
  endDate: "",
  autoRenew: false,
  noticePeriodDays: 30,
  salary: undefined,
  contractCurrency: "NGN",
};

export function ContractFormModal({
  open,
  contract,
  onClose,
  onSave,
}: ContractFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevContract, setPrevContract] = useState<Contract | null>(null);

  const [form, setForm] = useState<NewContract>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});

  if (open !== prevOpen || contract !== prevContract) {
    setPrevOpen(open);
    setPrevContract(contract);
    if (open) {
      if (contract) {
        setForm({
          title: contract.title,
          description: contract.description ?? "",
          contractType: contract.contractType,
          status: contract.status,
          employeeName: contract.employeeName,
          employeeInitials: contract.employeeInitials,
          department: contract.department,
          startDate: contract.startDate,
          endDate: contract.endDate ?? "",
          autoRenew: contract.autoRenew,
          noticePeriodDays: contract.noticePeriodDays,
          salary: contract.salary,
          contractCurrency: contract.contractCurrency,
        });
      } else {
        setForm(EMPTY);
      }
      setErrors({});
    }
  }

  function set<K extends keyof NewContract>(key: K, value: NewContract[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit() {
    const result = contractSchema.safeParse(form);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof NewContract;
        if (!errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    const data = result.data;
    onSave({
      ...data,
      salary:
        data.salary === "" ? undefined : (data.salary as number | undefined),
      endDate: data.endDate || undefined,
    } as NewContract);
  }

  const isEdit = !!contract;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contract" : "New Contract"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[68vh] pr-1">
          <div className="space-y-5 px-1 py-2">
            <div className="space-y-1.5">
              <Label>Contract Title</Label>
              <Input
                placeholder="e.g. Employment Contract — Software Engineer"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                placeholder="Describe the terms, responsibilities, or scope of this contract..."
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contract Type</Label>
                <Select
                  value={form.contractType}
                  onValueChange={(v) => set("contractType", v as ContractType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contractType && (
                  <p className="text-xs text-destructive">
                    {errors.contractType}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v as ContractStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-xs text-destructive">{errors.status}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Employee Name</Label>
                <Input
                  placeholder="Full name"
                  value={form.employeeName}
                  onChange={(e) => set("employeeName", e.target.value)}
                />
                {errors.employeeName && (
                  <p className="text-xs text-destructive">
                    {errors.employeeName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Initials</Label>
                <Input
                  placeholder="e.g. CO"
                  maxLength={3}
                  value={form.employeeInitials}
                  onChange={(e) =>
                    set("employeeInitials", e.target.value.toUpperCase())
                  }
                />
                {errors.employeeInitials && (
                  <p className="text-xs text-destructive">
                    {errors.employeeInitials}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => set("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-xs text-destructive">{errors.department}</p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  End Date{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Notice Period (days)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 30"
                  value={
                    form.noticePeriodDays === 0
                      ? "0"
                      : form.noticePeriodDays || ""
                  }
                  onChange={(e) =>
                    set("noticePeriodDays", Number(e.target.value))
                  }
                />
                {errors.noticePeriodDays && (
                  <p className="text-xs text-destructive">
                    {errors.noticePeriodDays}
                  </p>
                )}
              </div>

              <div className="flex items-end gap-3 pb-0.5">
                <div className="flex flex-col gap-1">
                  <Label>Auto-Renew</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={form.autoRenew}
                      onCheckedChange={(v) => set("autoRenew", v)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.autoRenew ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>
                  Salary / Rate{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 850000"
                  value={form.salary ?? ""}
                  onChange={(e) =>
                    set(
                      "salary",
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                    )
                  }
                />
                {errors.salary && (
                  <p className="text-xs text-destructive">{errors.salary}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select
                  value={form.contractCurrency}
                  onValueChange={(v) => set("contractCurrency", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Create Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
