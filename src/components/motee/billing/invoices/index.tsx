"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  FileText,
  ArrowRight,
  Plus,
  X,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Ban,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_INVOICES, DEMO_TENANTS } from "@/src/data/motee-demo";
import type { Invoice } from "@/src/lib/types/motee.types";

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-[#4ED251]/10 text-[#4ED251]",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  voided: "bg-slate-500/10 text-slate-500",
  refunded: "bg-violet-500/10 text-violet-500",
};

type StatusFilter = "all" | "paid" | "pending" | "overdue";

const statusCounts = {
  all: DEMO_INVOICES.length,
  paid: DEMO_INVOICES.filter((i) => i.status === "paid").length,
  pending: DEMO_INVOICES.filter((i) => i.status === "pending").length,
  overdue: DEMO_INVOICES.filter((i) => i.status === "overdue").length,
};

const totalRevenue = DEMO_INVOICES.filter((i) => i.status === "paid").reduce(
  (a, b) => a + b.amount,
  0,
);
const totalPending = DEMO_INVOICES.filter((i) => i.status === "pending").reduce(
  (a, b) => a + b.amount,
  0,
);
const totalOverdue = DEMO_INVOICES.filter((i) => i.status === "overdue").reduce(
  (a, b) => a + b.amount,
  0,
);

function getInvoiceLineItems(invoice: Invoice) {
  const planName =
    invoice.amount === 2499
      ? "Enterprise"
      : invoice.amount === 999
        ? "Growth"
        : "Starter";
  const subtotal = Math.round((invoice.amount / 1.075) * 100) / 100;
  const tax = Math.round((invoice.amount - subtotal) * 100) / 100;
  return {
    lineItems: [
      {
        description: `${planName} Plan — Monthly Subscription`,
        qty: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ],
    subtotal,
    taxRate: 7.5,
    tax,
    total: invoice.amount,
    paymentMethod: invoice.status === "paid" ? "Bank Transfer" : null,
    paymentDate: invoice.status === "paid" ? invoice.dueDate : null,
  };
}

export function BillingInvoicesPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidRef, setMarkPaidRef] = useState("");
  const [markPaidNote, setMarkPaidNote] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [invoiceStatuses, setInvoiceStatuses] = useState<
    Record<string, string>
  >({});
  const [newInvoice, setNewInvoice] = useState({
    tenant: "",
    amount: "",
    dueDate: "",
    description: "",
  });

  const tenantNames = useMemo(() => {
    const names = Array.from(new Set(DEMO_INVOICES.map((i) => i.tenantName)));
    return names.sort();
  }, []);

  const filtered = useMemo(() => {
    return DEMO_INVOICES.filter((inv) => {
      const currentStatus = invoiceStatuses[inv.id] ?? inv.status;
      const matchSearch =
        search === "" ||
        inv.tenantName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || currentStatus === statusFilter;
      const matchTenant =
        tenantFilter === "all" || inv.tenantName === tenantFilter;
      const matchDateFrom = dateFrom === "" || inv.issuedDate >= dateFrom;
      const matchDateTo = dateTo === "" || inv.issuedDate <= dateTo;
      const matchAmountMin =
        amountMin === "" || inv.amount >= Number(amountMin);
      const matchAmountMax =
        amountMax === "" || inv.amount <= Number(amountMax);
      return (
        matchSearch &&
        matchStatus &&
        matchTenant &&
        matchDateFrom &&
        matchDateTo &&
        matchAmountMin &&
        matchAmountMax
      );
    }).sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  }, [
    search,
    statusFilter,
    tenantFilter,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    invoiceStatuses,
  ]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${statusCounts.all})` },
    { key: "paid", label: `Paid (${statusCounts.paid})` },
    { key: "pending", label: `Pending (${statusCounts.pending})` },
    { key: "overdue", label: `Overdue (${statusCounts.overdue})` },
  ];

  function getDisplayStatus(invoice: Invoice) {
    return invoiceStatuses[invoice.id] ?? invoice.status;
  }

  function handleMarkPaid() {
    if (!selectedInvoice || !markPaidRef.trim()) return;
    setInvoiceStatuses((prev) => ({ ...prev, [selectedInvoice.id]: "paid" }));
    setShowMarkPaidModal(false);
    setMarkPaidRef("");
    setMarkPaidNote("");
  }

  function handleRefund() {
    if (!selectedInvoice || !refundReason.trim()) return;
    setInvoiceStatuses((prev) => ({
      ...prev,
      [selectedInvoice.id]: "refunded",
    }));
    setShowRefundModal(false);
    setRefundReason("");
    setRefundAmount("");
    setRefundType("full");
  }

  function handleVoid() {
    if (!selectedInvoice || !voidReason.trim()) return;
    setInvoiceStatuses((prev) => ({ ...prev, [selectedInvoice.id]: "voided" }));
    setShowVoidModal(false);
    setVoidReason("");
  }

  const selectedDetail = selectedInvoice
    ? getInvoiceLineItems(selectedInvoice)
    : null;
  const selectedStatus = selectedInvoice
    ? getDisplayStatus(selectedInvoice)
    : null;
  const hasActiveFilters =
    dateFrom !== "" ||
    dateTo !== "" ||
    amountMin !== "" ||
    amountMax !== "" ||
    tenantFilter !== "all";
  const showDetailModal =
    selectedInvoice &&
    selectedDetail &&
    !showMarkPaidModal &&
    !showRefundModal &&
    !showVoidModal &&
    !showRetryModal;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {DEMO_INVOICES.length} invoices across all tenants
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="mt-1 text-2xl font-bold text-[#4ED251]">
              ${totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusCounts.paid} paid invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">
              ${totalPending.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusCounts.pending} invoices awaiting payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-red-500">
              ${totalOverdue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {statusCounts.overdue} past due date
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant or invoice ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
          >
            <option value="all">All Tenants</option>
            {tenantNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-auto text-sm"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-auto text-sm"
          />
          <Input
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            placeholder="Min $"
            className="w-28 text-sm"
          />
          <Input
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            placeholder="Max $"
            className="w-28 text-sm"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setAmountMin("");
                setAmountMax("");
                setTenantFilter("all");
              }}
              className="gap-1 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No invoices match your filters
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Issued
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((invoice) => {
                    const displayStatus = getDisplayStatus(invoice);
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <td className="px-6 py-3.5 text-sm font-mono text-muted-foreground">
                          {invoice.id.toUpperCase()}
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const tenant = DEMO_TENANTS.find(
                                (t) => t.id === invoice.tenantId,
                              );
                              if (tenant) router.push(`/tenants/${tenant.id}`);
                            }}
                            className="text-sm font-medium text-foreground hover:text-[#ff8b2d] transition-colors"
                          >
                            {invoice.tenantName}
                          </button>
                        </td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-foreground">
                          ${invoice.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">
                          {invoice.issuedDate}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">
                          {invoice.dueDate}
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge
                            className={`capitalize text-xs font-medium border-0 ${invoiceStatusStyles[displayStatus] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {displayStatus}
                          </Badge>
                        </td>
                        <td
                          className="px-6 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            {(displayStatus === "pending" ||
                              displayStatus === "overdue") && (
                              <>
                                {displayStatus === "overdue" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1 text-blue-500 hover:text-blue-600"
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowRetryModal(true);
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3" /> Retry
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs gap-1 text-[#4ED251] hover:text-[#4ED251]"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowMarkPaidModal(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Mark Paid
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs gap-1 text-red-500 hover:text-red-600"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowVoidModal(true);
                                  }}
                                >
                                  <Ban className="h-3 w-3" /> Void
                                </Button>
                              </>
                            )}
                            {displayStatus === "paid" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-violet-500 hover:text-violet-600"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowRefundModal(true);
                                }}
                              >
                                <RotateCcw className="h-3 w-3" /> Refund
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <FileText className="h-3 w-3" /> View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showDetailModal && (
        <Dialog open={true} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{selectedInvoice.id.toUpperCase()}</span>
                <Badge
                  className={`capitalize text-xs font-medium border-0 ${invoiceStatusStyles[selectedStatus!] ?? "bg-muted text-muted-foreground"}`}
                >
                  {selectedStatus}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Tenant</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {selectedInvoice.tenantName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Email</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {DEMO_TENANTS.find((t) => t.id === selectedInvoice.tenantId)
                      ?.billingEmail ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issued</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {selectedInvoice.issuedDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {selectedInvoice.dueDate}
                  </p>
                </div>
                {selectedDetail.paymentMethod && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Payment Method
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {selectedDetail.paymentMethod}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Payment Date
                      </p>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {selectedDetail.paymentDate}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Line Items
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs text-muted-foreground font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDetail.lineItems.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2.5 text-foreground">
                            {item.description}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            {item.qty}
                          </td>
                          <td className="px-4 py-2.5 text-right text-muted-foreground">
                            ${item.unitPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-foreground">
                            ${item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${selectedDetail.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT ({selectedDetail.taxRate}%)</span>
                  <span>${selectedDetail.tax.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-foreground text-base">
                  <span>Total</span>
                  <span>${selectedDetail.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              {(selectedStatus === "pending" ||
                selectedStatus === "overdue") && (
                <>
                  {selectedStatus === "overdue" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-blue-500 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
                      onClick={() => setShowRetryModal(true)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry Payment
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1 bg-[#4ED251] hover:bg-[#4ED251]/90 text-white"
                    onClick={() => setShowMarkPaidModal(true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark as Paid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    onClick={() => setShowVoidModal(true)}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Void
                  </Button>
                </>
              )}
              {selectedStatus === "paid" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-violet-500 border-violet-200 hover:bg-violet-50 dark:border-violet-900 dark:hover:bg-violet-950"
                  onClick={() => setShowRefundModal(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Refund
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showMarkPaidModal} onOpenChange={setShowMarkPaidModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#4ED251]" />
              Mark as Paid
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Invoice{" "}
              <span className="font-semibold text-foreground">
                {selectedInvoice?.id.toUpperCase()}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-foreground">
                {selectedInvoice?.tenantName}
              </span>
            </p>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Payment Reference <span className="text-red-500">*</span>
              </p>
              <Input
                placeholder="e.g. TXN-20260423-001"
                value={markPaidRef}
                onChange={(e) => setMarkPaidRef(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Note (optional)
              </p>
              <Textarea
                placeholder="Additional note about this payment..."
                value={markPaidNote}
                onChange={(e) => setMarkPaidNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMarkPaidModal(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!markPaidRef.trim()}
              onClick={handleMarkPaid}
              className="bg-[#4ED251] hover:bg-[#4ED251]/90 text-white"
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-violet-500" />
              Process Refund
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Refund against invoice{" "}
              <span className="font-semibold text-foreground">
                {selectedInvoice?.id.toUpperCase()}
              </span>{" "}
              — ${selectedInvoice?.amount.toLocaleString()}
            </p>
            <div className="flex gap-2">
              {(["full", "partial"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setRefundType(type)}
                  className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors capitalize ${
                    refundType === type
                      ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {type} Refund
                </button>
              ))}
            </div>
            {refundType === "partial" && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-foreground">
                  Amount <span className="text-red-500">*</span>
                </p>
                <Input
                  type="number"
                  placeholder="Enter refund amount"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Reason <span className="text-red-500">*</span>
              </p>
              <Textarea
                placeholder="Reason for this refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRefundModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !refundReason.trim() ||
                (refundType === "partial" && !refundAmount)
              }
              onClick={handleRefund}
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVoidModal} onOpenChange={setShowVoidModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Void Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Voided invoices cannot be paid. This action is logged.
            </p>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Reason <span className="text-red-500">*</span>
              </p>
              <Textarea
                placeholder="Reason for voiding this invoice..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowVoidModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={!voidReason.trim()}
              onClick={handleVoid}
              variant="destructive"
            >
              Void Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRetryModal} onOpenChange={setShowRetryModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Retry Payment
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Trigger a payment retry for invoice{" "}
              <span className="font-semibold text-foreground">
                {selectedInvoice?.id.toUpperCase()}
              </span>{" "}
              — ${selectedInvoice?.amount.toLocaleString()} for{" "}
              <span className="font-semibold text-foreground">
                {selectedInvoice?.tenantName}
              </span>
              .
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRetryModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowRetryModal(false)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Retry Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#ff8b2d]" />
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Tenant <span className="text-red-500">*</span>
              </p>
              <select
                value={newInvoice.tenant}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, tenant: e.target.value }))
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#ff8b2d]"
              >
                <option value="">Select a tenant</option>
                {DEMO_TENANTS.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Amount ($) <span className="text-red-500">*</span>
              </p>
              <Input
                type="number"
                placeholder="e.g. 1500"
                value={newInvoice.amount}
                onChange={(e) =>
                  setNewInvoice((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Due Date <span className="text-red-500">*</span>
              </p>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Description</p>
              <Textarea
                placeholder="e.g. Implementation fee, Premium support charge..."
                value={newInvoice.description}
                onChange={(e) =>
                  setNewInvoice((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !newInvoice.tenant || !newInvoice.amount || !newInvoice.dueDate
              }
              onClick={() => setShowCreateModal(false)}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
