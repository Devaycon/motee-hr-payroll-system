"use client";

import { useState } from "react";
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
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_CURRENCY_OPTIONS,
  type ExpenseCategory,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";
import { useCurrency } from "@/src/lib/hooks/use-currency";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (claim: Omit<ExpenseClaim, "id">) => void;
}

interface FormValues {
  title: string;
  category: ExpenseCategory;
  amount: string;
  currency: string;
  dateSubmitted: string;
  merchant: string;
  notes: string;
}

function getDefaults(currency: string): FormValues {
  return {
    title: "",
    category: "travel",
    amount: "",
    currency,
    dateSubmitted: new Date().toISOString().slice(0, 10),
    merchant: "",
    notes: "",
  };
}

export function ExpenseFormModal({
  open,
  onClose,
  onSave,
}: ExpenseFormModalProps) {
  const { code: tenantCurrency } = useCurrency();
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(() =>
    getDefaults(tenantCurrency),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>(
    {},
  );

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(getDefaults(tenantCurrency));
      setErrors({});
    }
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSave() {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (form.title.trim().length < 3)
      next.title = "Title must be at least 3 characters";
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0)
      next.amount = "Enter a valid amount";
    if (!form.merchant.trim()) next.merchant = "Merchant is required";
    if (!form.dateSubmitted) next.dateSubmitted = "Date is required";

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    onSave({
      title: form.title.trim(),
      category: form.category,
      amount,
      currency: form.currency,
      dateSubmitted: form.dateSubmitted,
      status: "submitted",
      merchant: form.merchant.trim(),
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>New Expense Claim</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-5 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="exp-title">Title</Label>
              <Input
                id="exp-title"
                placeholder="What was this expense for?"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v as ExpenseCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-amount">Amount</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => set("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exp-merchant">Merchant</Label>
                <Input
                  id="exp-merchant"
                  placeholder="e.g. Uber, Hilton"
                  value={form.merchant}
                  onChange={(e) => set("merchant", e.target.value)}
                />
                {errors.merchant && (
                  <p className="text-xs text-destructive">{errors.merchant}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exp-date">Date</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={form.dateSubmitted}
                  onChange={(e) => set("dateSubmitted", e.target.value)}
                />
                {errors.dateSubmitted && (
                  <p className="text-xs text-destructive">
                    {errors.dateSubmitted}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp-notes">Notes (optional)</Label>
              <Textarea
                id="exp-notes"
                rows={3}
                placeholder="Add any context for the approver..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Submit Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
