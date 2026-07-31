"use client";

import { useState } from "react";
import { Paperclip, X } from "lucide-react";
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
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_CURRENCY_OPTIONS,
  type ExpenseCategory,
  type ExpenseClaim,
} from "@/src/data/employee-expenses-demo";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import {
  formatBytes,
  isPreviewable,
  readAttachments,
  type FileAttachment,
} from "@/src/lib/utils/file-attachments";

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
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(getDefaults(tenantCurrency));
      setErrors({});
      setAttachments([]);
    }
  }

  /** Receipts are held as data URLs, so they can be previewed before sending. */
  async function handleFiles(list: FileList | null) {
    const { attachments: added, errors: failed } = await readAttachments(list);
    failed.forEach((message) => toast.error(message));
    if (added.length) setAttachments((prev) => [...prev, ...added]);
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
      attachments: attachments.length ? attachments : undefined,
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

            {/* Receipts travel with the claim, so the approver doesn't have to
                chase them separately. */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Receipts &amp; supporting documents
              </Label>
              <FileDropzone
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                hint="Receipts, invoices or statements — up to 2 MB each"
                onFiles={handleFiles}
              />
              {attachments.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Claims sent without a receipt are usually returned for one.
                </p>
              ) : (
                <ul className="space-y-1.5 pt-0.5">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate text-foreground">
                          {a.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          · {formatBytes(a.sizeBytes)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={a.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          {...(isPreviewable(a.mimeType)
                            ? {}
                            : { download: a.name })}
                          className="px-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          {isPreviewable(a.mimeType) ? "View" : "Download"}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((x) => x.id !== a.id),
                            )
                          }
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
