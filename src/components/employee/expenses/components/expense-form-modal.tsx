"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Paperclip,
  X,
  Check,
  ChevronsUpDown,
  CalendarIcon,
  Loader2,
  AlertTriangle,
  Save,
  ScanText,
  Car,
} from "lucide-react";
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
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  EXPENSE_CATEGORY_ICONS,
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
import { cn } from "@/src/lib/utils";
import { findDuplicates, duplicateWarning } from "../duplicate-check";
import { calculateMileage, type DistanceUnit } from "../mileage";
import { extractFromText, toClaimPatch } from "../receipt-extract";

interface ExpenseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (claim: Omit<ExpenseClaim, "id">) => void;
  /** Merchants already used, offered as autocomplete suggestions (§9.4). */
  knownMerchants?: string[];
  /** Existing claims, checked for duplicates before submitting (§9.10). */
  existingClaims?: ExpenseClaim[];
  /** §9.15 — a saved draft being picked back up. */
  editingClaim?: ExpenseClaim | null;
}

/** §9.7 — the currency the employee last filed in, remembered between claims. */
const LAST_CURRENCY_KEY = "motee:expenses:lastCurrency";

function readLastCurrency(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_CURRENCY_KEY);
  } catch {
    return null;
  }
}

function writeLastCurrency(code: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_CURRENCY_KEY, code);
  } catch {
    // private mode / quota — the tenant default still applies
  }
}

/**
 * Validation lives in the schema so each message is specific rather than
 * generic (client feedback §9.11), matching how the rest of the app validates.
 */
const claimSchema = z.object({
  title: z.string().trim().min(3, "Give the expense a title of at least 3 characters."),
  category: z.string().min(1, "Choose a category."),
  merchant: z.string().trim().min(1, "Merchant name is required."),
  amount: z
    .string()
    .min(1, "Enter an amount.")
    .refine((v) => Number(v.replace(/,/g, "")) > 0, "Amount must be greater than 0."),
  currency: z.string().min(1, "Choose a currency."),
  dateSubmitted: z.string().min(1, "Date is required."),
});

type FieldName = keyof z.infer<typeof claimSchema>;

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

/** ISO date → "05 Aug 2026", which reads the same in every locale (§9.5). */
function displayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Group digits as the user types, preserving a single decimal part (§9.3). */
function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const grouped = whole ? Number(whole).toLocaleString("en-US") : "";
  if (rest.length === 0) return grouped;
  return `${grouped}.${rest.join("").slice(0, 2)}`;
}

/** §9.15 — a saved draft, back in form shape. */
function formFromClaim(claim: ExpenseClaim, fallbackCurrency: string): FormValues {
  return {
    title: claim.title,
    category: claim.category,
    amount: claim.amount ? formatAmountInput(String(claim.amount)) : "",
    currency: claim.currency ?? fallbackCurrency,
    dateSubmitted: claim.dateSubmitted,
    merchant: claim.merchant,
    notes: claim.notes ?? "",
  };
}

export function ExpenseFormModal({
  open,
  onClose,
  onSave,
  knownMerchants = [],
  existingClaims = [],
  editingClaim = null,
}: ExpenseFormModalProps) {
  const { code: tenantCurrency } = useCurrency();
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(() =>
    getDefaults(tenantCurrency),
  );
  // Only fields the user has interacted with show an error, so the form is
  // never red on open (§9.1).
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  /** §9.10 — set once the user has seen the duplicate warning and continued. */
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  // §9.15 — receipt text extraction and the mileage calculator.
  const [extractOpen, setExtractOpen] = useState(false);
  const [receiptText, setReceiptText] = useState("");
  const [mileageOpen, setMileageOpen] = useState(false);
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("miles");

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const fallbackCurrency = readLastCurrency() ?? tenantCurrency;
      // §9.15 — a reopened draft comes back exactly as it was left; otherwise
      // §9.7 defaults to whatever they filed in last.
      setForm(
        editingClaim
          ? formFromClaim(editingClaim, fallbackCurrency)
          : getDefaults(fallbackCurrency),
      );
      setTouched({});
      setSubmitAttempted(false);
      setSubmitting(false);
      setAttachments(editingClaim?.attachments ?? []);
      setDuplicateAcknowledged(false);
      setExtractOpen(false);
      setReceiptText("");
      setMileageOpen(false);
      setDistance("");
    }
  }

  const parsed = claimSchema.safeParse(form);
  const errors = useMemo(() => {
    if (parsed.success) return {} as Partial<Record<FieldName, string>>;
    const out: Partial<Record<FieldName, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as FieldName;
      out[key] ??= issue.message;
    }
    return out;
  }, [parsed]);

  const showError = (field: FieldName) =>
    (touched[field] || submitAttempted) && errors[field];

  const currencySymbol =
    EXPENSE_CURRENCY_OPTIONS.find((c) => c.value === form.currency)
      ?.label.split(" ")[1] ?? "";

  /** §8.6 / §9.10 — claims that look like the one being entered. */
  const duplicates = useMemo(() => {
    const amount = Number(form.amount.replace(/,/g, ""));
    if (!amount || !form.merchant.trim() || !form.dateSubmitted) return [];
    return findDuplicates(
      {
        amount,
        merchant: form.merchant,
        dateSubmitted: form.dateSubmitted,
        category: form.category,
      },
      existingClaims,
      // A reopened draft must not be flagged as a duplicate of itself (§9.15).
      { excludeId: editingClaim?.id },
    );
  }, [
    form.amount,
    form.merchant,
    form.dateSubmitted,
    form.category,
    existingClaims,
    editingClaim,
  ]);

  /** Receipts are held as data URLs, so they can be previewed before sending. */
  async function handleFiles(list: FileList | null) {
    const { attachments: added, errors: failed } = await readAttachments(list);
    failed.forEach((message) => toast.error(message));
    if (added.length) setAttachments((prev) => [...prev, ...added]);
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function blur(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  /** §9.15 — pull what we can out of pasted receipt text. */
  function handleExtract() {
    const extracted = extractFromText(receiptText);
    const patch = toClaimPatch(extracted);
    if (Object.keys(patch).length === 0) {
      toast.error("Nothing recognisable in that text", {
        description: "Paste the receipt body including the total and date.",
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      merchant: patch.merchant ?? prev.merchant,
      amount:
        patch.amount != null
          ? formatAmountInput(String(patch.amount))
          : prev.amount,
      currency: patch.currency ?? prev.currency,
      dateSubmitted: patch.dateSubmitted ?? prev.dateSubmitted,
      category: patch.category ?? prev.category,
      title: prev.title || (patch.merchant ? `Expense at ${patch.merchant}` : ""),
    }));
    setExtractOpen(false);
    toast.success("Details filled in from the receipt", {
      description: extracted.missing.length
        ? `Still needs: ${extracted.missing.join(", ")}. Check everything before submitting.`
        : "Check everything before submitting.",
    });
  }

  /** §9.15 — distance × rate, with the working written into the notes. */
  function handleMileage() {
    const value = Number(distance.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a distance greater than 0.");
      return;
    }
    const result = calculateMileage({ distance: value, unit: distanceUnit });
    setForm((prev) => ({
      ...prev,
      amount: formatAmountInput(result.amount.toFixed(2)),
      notes: prev.notes
        ? `${prev.notes}\nMileage: ${result.workings}`
        : `Mileage: ${result.workings}`,
    }));
    setMileageOpen(false);
    toast.success("Mileage calculated", { description: result.workings });
  }

  /** §9.15 — park an incomplete claim without running the submit gauntlet. */
  function handleSaveDraft() {
    if (!form.title.trim() && !form.merchant.trim() && !form.amount) {
      toast.error("Add at least a title, merchant or amount to save a draft.");
      return;
    }
    writeLastCurrency(form.currency);
    onSave({
      title: form.title.trim() || "Untitled expense",
      category: form.category,
      amount: Number(form.amount.replace(/,/g, "")) || 0,
      currency: form.currency,
      dateSubmitted: form.dateSubmitted,
      status: "draft",
      merchant: form.merchant.trim(),
      notes: form.notes.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
    });
  }

  function handleSave() {
    setSubmitAttempted(true);
    if (!parsed.success) return;
    // §9.10 — warn once, then let them proceed if they meant it.
    if (duplicates.length > 0 && !duplicateAcknowledged) {
      setDuplicateAcknowledged(true);
      toast.warning("This looks like a duplicate", {
        description: duplicateWarning(duplicates[0], (n) =>
          `${currencySymbol}${n.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        ),
      });
      return;
    }
    setSubmitting(true);
    writeLastCurrency(form.currency);
    onSave({
      title: form.title.trim(),
      category: form.category,
      amount: Number(form.amount.replace(/,/g, "")),
      currency: form.currency,
      dateSubmitted: form.dateSubmitted,
      status: "submitted",
      merchant: form.merchant.trim(),
      notes: form.notes.trim() || undefined,
      attachments: attachments.length ? attachments : undefined,
    });
  }

  const CategoryIcon = EXPENSE_CATEGORY_ICONS[form.category];
  const selectedDate = form.dateSubmitted
    ? new Date(`${form.dateSubmitted}T00:00:00`)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col gap-0 p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle>
            {editingClaim ? "Edit Draft Claim" : "New Expense Claim"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-5 pb-4">
            {/* §9.15 — shortcuts that fill the form in, offered before the
                fields so they are found before everything is typed by hand. */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  setExtractOpen((v) => !v);
                  setMileageOpen(false);
                }}
              >
                <ScanText className="h-3.5 w-3.5" />
                Extract from receipt
              </Button>
              {form.category === "travel" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setMileageOpen((v) => !v);
                    setExtractOpen(false);
                  }}
                >
                  <Car className="h-3.5 w-3.5" />
                  Calculate mileage
                </Button>
              )}
            </div>

            {extractOpen && (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <Label htmlFor="exp-receipt-text" className="text-xs">
                  Paste the receipt text
                </Label>
                <Textarea
                  id="exp-receipt-text"
                  rows={5}
                  className="text-xs"
                  placeholder={
                    "Paste an email receipt or PDF text here, e.g.\n\nPremier Inn London\n14/08/2026\nTotal: £128.50"
                  }
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                />
                {/* Said plainly: this reads text, not photographs. Implying
                    otherwise would fail on the one input people would try. */}
                <p className="text-[11px] text-muted-foreground">
                  Reads pasted text, not photos. Snap a receipt into an email or
                  PDF and paste the text here — then check every field it fills.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!receiptText.trim()}
                    onClick={handleExtract}
                  >
                    Fill in the form
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setExtractOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {mileageOpen && (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <Label className="text-xs">Journey distance</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    className="h-8 w-28"
                    placeholder="0"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                  />
                  <Select
                    value={distanceUnit}
                    onValueChange={(v) => setDistanceUnit(v as DistanceUnit)}
                  >
                    <SelectTrigger className="h-8 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miles">miles</SelectItem>
                      <SelectItem value="km">km</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleMileage}
                  >
                    Calculate
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Uses the standard 0.45/mile rate. The working is added to your
                  notes so an approver can see how the figure was reached.
                </p>
              </div>
            )}

            {/* Field order per §9.16: what → who → how much → when → evidence. */}
            <Field
              id="exp-title"
              label="Title"
              required
              error={showError("title")}
            >
              <Input
                id="exp-title"
                placeholder="e.g. Client lunch with ABC Ltd, Taxi to Heathrow"
                value={form.title}
                aria-invalid={Boolean(showError("title"))}
                aria-describedby={showError("title") ? "exp-title-error" : undefined}
                onChange={(e) => set("title", e.target.value)}
                onBlur={() => blur("title")}
              />
            </Field>

            <Field id="exp-category" label="Category" required>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="exp-category"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      {
                        EXPENSE_CATEGORY_OPTIONS.find(
                          (c) => c.value === form.category,
                        )?.label
                      }
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                  <Command>
                    <CommandInput placeholder="Search categories…" />
                    <CommandList>
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {EXPENSE_CATEGORY_OPTIONS.map((c) => {
                          const Icon = EXPENSE_CATEGORY_ICONS[c.value];
                          return (
                            <CommandItem
                              key={c.value}
                              value={c.label}
                              onSelect={() => {
                                set("category", c.value);
                                setCategoryOpen(false);
                              }}
                            >
                              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {c.label}
                              {form.category === c.value && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>

            <Field
              id="exp-merchant"
              label="Merchant"
              required
              error={showError("merchant")}
            >
              <Input
                id="exp-merchant"
                placeholder="e.g. Uber, Hilton"
                list="exp-merchant-suggestions"
                value={form.merchant}
                aria-invalid={Boolean(showError("merchant"))}
                aria-describedby={
                  showError("merchant") ? "exp-merchant-error" : undefined
                }
                onChange={(e) => set("merchant", e.target.value)}
                onBlur={() => blur("merchant")}
              />
              {/* §9.4 — recently used merchants, without a bespoke dropdown. */}
              <datalist id="exp-merchant-suggestions">
                {knownMerchants.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>

            {/* Stacks on mobile so neither field gets squeezed (§9.14). */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="exp-amount"
                label="Amount"
                required
                error={showError("amount")}
              >
                {/* §9.3 — symbol sits inside the field, next to the number. */}
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    {currencySymbol}
                  </span>
                  <Input
                    id="exp-amount"
                    inputMode="decimal"
                    placeholder="Enter amount"
                    className="pl-7"
                    value={form.amount}
                    aria-invalid={Boolean(showError("amount"))}
                    aria-describedby={
                      showError("amount") ? "exp-amount-error" : undefined
                    }
                    onChange={(e) =>
                      set("amount", formatAmountInput(e.target.value))
                    }
                    onBlur={() => blur("amount")}
                  />
                </div>
              </Field>

              <Field id="exp-currency" label="Currency" required>
                <Select
                  value={form.currency}
                  onValueChange={(v) => set("currency", v)}
                >
                  <SelectTrigger id="exp-currency" className="w-full">
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
              </Field>
            </div>

            <Field
              id="exp-date"
              label="Date"
              required
              error={showError("dateSubmitted")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="exp-date"
                      type="button"
                      variant="outline"
                      className="min-w-44 flex-1 justify-start gap-2 font-normal"
                    >
                      {/* Generous hit area on the icon (§9.13). */}
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {displayDate(form.dateSubmitted) || "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) set("dateSubmitted", toIso(d));
                        setDateOpen(false);
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => set("dateSubmitted", toIso(new Date()))}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    set("dateSubmitted", toIso(d));
                  }}
                >
                  Yesterday
                </Button>
              </div>
            </Field>

            {/* Receipts travel with the claim, so the approver doesn't have to
                chase them separately. */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Receipts &amp; supporting documents
              </Label>
              <FileDropzone
                multiple
                acceptPaste
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                hint="PDF, JPG, PNG (max 2 MB) — or paste a screenshot with Ctrl/Cmd+V"
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
                        {/* A thumbnail confirms the right image was attached. */}
                        {a.mimeType.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.dataUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
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

            {/* §9.10 — surface the near-match inline, not just on submit. */}
            {duplicates.length > 0 && (
              <div
                role="status"
                className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3"
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  This expense looks similar to one submitted previously
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {duplicates.slice(0, 2).map((d) => (
                    <li
                      key={d.claim.id}
                      className="text-xs text-amber-700 dark:text-amber-400"
                    >
                      · {d.claim.title} — {d.reasons.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Field id="exp-notes" label="Notes" optional>
              <Textarea
                id="exp-notes"
                rows={3}
                placeholder="Optional: Explain business purpose, attendees, or exceptions."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Sticky footer keeps Submit reachable while the body scrolls (§9.14). */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {/* §9.15 — a draft skips validation entirely; the point is to stop
                losing a half-typed claim, not to enforce completeness. */}
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={submitting}
              onClick={handleSaveDraft}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={handleSave}
              disabled={!parsed.success || submitting}
              className="gap-1.5"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit Claim"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string | false;
  children: React.ReactNode;
}

/** Label + control + error, wired together for screen readers (§9.1, §9.13). */
function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        )}
        {optional && (
          <span className="text-muted-foreground font-normal"> (optional)</span>
        )}
      </Label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className={cn("text-xs text-destructive")}
        >
          {error}
        </p>
      )}
    </div>
  );
}
