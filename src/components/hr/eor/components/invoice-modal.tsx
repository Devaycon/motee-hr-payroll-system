"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { EorInvoice, EorProvider } from "../types";
import type { EorInvoiceRequest } from "@/src/types/eor";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

interface Draft {
  providerId: string;
  period: string;
  reference: string;
  currency: string;
  workers: string;
  grossPay: string;
  employerCosts: string;
  managementFee: string;
  issuedOn: string;
  dueOn: string;
}

const num = (v: string) => (v.trim() === "" ? 0 : Number(v));

/**
 * Billing → New / Edit invoice. Signed in only: POST /eor/invoices or
 * PUT /eor/invoices/{id}. The total is the sum of the three amounts.
 */
export function InvoiceModal({
  open,
  invoice,
  providers,
  onClose,
  onSave,
}: {
  open: boolean;
  invoice: EorInvoice | null;
  providers: EorProvider[];
  onClose: () => void;
  onSave: (body: EorInvoiceRequest, id?: string) => Promise<boolean>;
}) {
  const blank = (): Draft => ({
    providerId: providers[0]?.id ?? "",
    period: today().slice(0, 7),
    reference: "",
    currency: "USD",
    workers: "",
    grossPay: "",
    employerCosts: "",
    managementFee: "",
    issuedOn: today(),
    dueOn: inDays(30),
  });
  const [draft, setDraft] = useState<Draft>(blank);
  const [saving, setSaving] = useState(false);
  const [seen, setSeen] = useState<{ open: boolean; invoice: EorInvoice | null }>({ open: false, invoice: null });
  if (seen.open !== open || seen.invoice !== invoice) {
    setSeen({ open, invoice });
    if (open) {
      setDraft(
        invoice
          ? {
              providerId: invoice.providerId,
              period: invoice.periodKey ?? today().slice(0, 7),
              reference: invoice.reference ?? "",
              currency: invoice.currency ?? "USD",
              workers: String(invoice.workerCount ?? ""),
              grossPay: String(invoice.grossPay ?? ""),
              employerCosts: String(invoice.employerCosts ?? ""),
              managementFee: String(invoice.managementFee ?? ""),
              issuedOn: invoice.issuedAt.slice(0, 10),
              dueOn: invoice.dueAt.slice(0, 10),
            }
          : blank(),
      );
    }
  }

  const set = (k: keyof Draft) => (v: string) => setDraft((d) => ({ ...d, [k]: v }));
  const total = num(draft.grossPay) + num(draft.employerCosts) + num(draft.managementFee);
  const valid = !!draft.providerId && !!draft.period && !!draft.issuedOn && !!draft.dueOn;

  async function save() {
    if (!valid) return;
    setSaving(true);
    const ok = await onSave(
      {
        providerId: draft.providerId,
        period: draft.period,
        reference: draft.reference.trim() || null,
        currency: draft.currency.trim().toUpperCase() || "USD",
        billedWorkerCount: num(draft.workers),
        grossPay: num(draft.grossPay),
        employerCosts: num(draft.employerCosts),
        managementFee: num(draft.managementFee),
        total,
        issuedOn: draft.issuedOn,
        dueOn: draft.dueOn,
      },
      invoice?.id,
    );
    setSaving(false);
    if (ok) onClose();
  }

  const field = (label: string, el: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium">{label}</p>
      {el}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? "Edit invoice" : "New invoice"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            {field(
              "Provider",
              <Select value={draft.providerId} onValueChange={set("providerId")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>,
            )}
          </div>
          {field("Billing month", <Input type="month" value={draft.period} onChange={(e) => set("period")(e.target.value)} />)}
          {field("Reference", <Input value={draft.reference} onChange={(e) => set("reference")(e.target.value)} placeholder="INV-0001" />)}
          {field("Currency", <Input value={draft.currency} onChange={(e) => set("currency")(e.target.value)} maxLength={3} />)}
          {field("Workers billed", <Input type="number" min={0} value={draft.workers} onChange={(e) => set("workers")(e.target.value)} />)}
          {field("Gross pay", <Input type="number" min={0} value={draft.grossPay} onChange={(e) => set("grossPay")(e.target.value)} />)}
          {field("Employer costs", <Input type="number" min={0} value={draft.employerCosts} onChange={(e) => set("employerCosts")(e.target.value)} />)}
          {field("Management fee", <Input type="number" min={0} value={draft.managementFee} onChange={(e) => set("managementFee")(e.target.value)} />)}
          {field("Total", <Input value={total.toLocaleString()} readOnly className="bg-muted/40" />)}
          {field("Issued", <Input type="date" value={draft.issuedOn} onChange={(e) => set("issuedOn")(e.target.value)} />)}
          {field("Due", <Input type="date" value={draft.dueOn} onChange={(e) => set("dueOn")(e.target.value)} />)}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid || saving} onClick={() => void save()}>
            {saving ? "Saving…" : invoice ? "Save" : "Add invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
