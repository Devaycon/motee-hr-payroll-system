"use client";

import { isServerId, usePeopleDirectory } from "@/src/lib/live/use-is-live";
import { useGetEorProviderQuery, useGetEorWorkerQuery } from "@/src/store/services/eor";
import { providerFromApi, workerFromApi } from "@/src/lib/eor/api-mapping";
import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  StatCards,
  matchesWorkerCardFilter,
  matchesProviderCardFilter,
  EOR_CARD_FILTER_LABELS,
  type EorCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { WorkersTable } from "./components/workers-table";
import { ProvidersTable } from "./components/providers-table";
import { ComplianceTable } from "./components/compliance-table";
import { InvoicesTable } from "./components/invoices-table";
import { InvoiceModal } from "./components/invoice-modal";
import { PromptDialog, type PromptRequest } from "@/src/components/shared/prompt-dialog";
import { toast } from "sonner";
import type { EorInvoice } from "./types";
import type { ComplianceState } from "@/src/types/eor";
import { WorkerModal } from "./components/worker-modal";
import { ProviderModal } from "./components/provider-modal";
import { WorkerDetail } from "./components/worker-detail";
import { EOR_WORKERS, EOR_PROVIDERS, EOR_INVOICES } from "./data";
import { useEorActions, useLiveEor } from "@/src/lib/eor/use-eor";
import type { EorWorker, EorProvider } from "./types";

export function EorPage() {
  const [workers, setWorkers] = useState<EorWorker[]>(EOR_WORKERS);
  const [providers, setProviders] = useState<EorProvider[]>(EOR_PROVIDERS);
  // Signed in: the API copy replaces the demo one, and is re-read after
  // every change sent below.
  const eor = useLiveEor();
  const actions = useEorActions();
  const [seen, setSeen] = useState<{ w: typeof eor.workers; p: typeof eor.providers }>({
    w: null,
    p: null,
  });
  if (eor.workers && eor.workers !== seen.w) {
    setSeen((s) => ({ ...s, w: eor.workers }));
    setWorkers(eor.workers);
  }
  if (eor.providers && eor.providers !== seen.p) {
    setSeen((s) => ({ ...s, p: eor.providers }));
    setProviders(eor.providers);
  }
  const invoices = eor.live ? (eor.invoices ?? []) : EOR_INVOICES;
  const [invoiceModal, setInvoiceModal] = useState<{ invoice: EorInvoice | null } | null>(null);
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const COMPLIANCE_TO_API: Record<string, ComplianceState> = {
    complete: "complete",
    pending: "pending",
    action_required: "actionRequired",
    not_applicable: "notApplicable",
  };

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("workers");
  /** Drill-down set by the KPI cards; "all" shows every row. */
  const [cardFilter, setCardFilter] = useState<EorCardFilter>("all");

  const visibleWorkers = workers.filter((w) =>
    matchesWorkerCardFilter(w, cardFilter),
  );
  const visibleProviders = providers.filter((p) =>
    matchesProviderCardFilter(p, cardFilter),
  );

  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<EorWorker | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EorProvider | null>(null);

  // Derive the detail worker from state so edits reflect immediately.
  const listWorker = workers.find((w) => w.id === detailId) ?? null;
  // Signed in: the opened worker and their provider are read fresh
  // (GET /eor/workers/{id}, GET /eor/providers/{id}).
  const people = usePeopleDirectory();
  const workerQ = useGetEorWorkerQuery(detailId ?? "", {
    skip: !eor.live || !detailId || !isServerId(detailId),
  });
  const detailWorker =
    workerQ.data?.data && listWorker
      ? {
          ...listWorker,
          ...workerFromApi(workerQ.data.data, people.byId.get(workerQ.data.data.employeeId)),
          // The compliance board's checklist stays the fresher one.
          compliance: listWorker.compliance,
        }
      : listWorker;
  const providerQ = useGetEorProviderQuery(detailWorker?.providerId ?? "", {
    skip: !eor.live || !detailWorker || !isServerId(detailWorker.providerId),
  });
  const detailProvider = providerQ.data?.data
    ? providerFromApi(providerQ.data.data)
    : providers.find((p) => p.id === detailWorker?.providerId);

  // ── Worker CRUD ──
  function openAddWorker() {
    setEditingWorker(null);
    setWorkerModalOpen(true);
  }
  function openEditWorker(worker: EorWorker) {
    setEditingWorker(worker);
    setWorkerModalOpen(true);
  }
  function saveWorker(worker: EorWorker) {
    void actions.saveWorker(worker);
    setWorkers((prev) => {
      const exists = prev.some((w) => w.id === worker.id);
      return exists
        ? prev.map((w) => (w.id === worker.id ? worker : w))
        : [worker, ...prev];
    });
  }
  function deleteWorker(id: string) {
    void actions.deleteWorker(id);
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  }

  // ── Provider CRUD ──
  function openAddProvider() {
    setEditingProvider(null);
    setProviderModalOpen(true);
  }
  function openEditProvider(provider: EorProvider) {
    setEditingProvider(provider);
    setProviderModalOpen(true);
  }
  function saveProvider(provider: EorProvider) {
    void actions.saveProvider(provider);
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === provider.id);
      return exists
        ? prev.map((p) => (p.id === provider.id ? provider : p))
        : [provider, ...prev];
    });
  }
  function deleteProvider(id: string) {
    void actions.deleteProvider(id);
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  if (detailWorker) {
    return (
      <>
        <WorkerDetail
          worker={detailWorker}
          provider={detailProvider}
          onBack={() => setDetailId(null)}
          onEdit={() => openEditWorker(detailWorker)}
          onEnd={
            eor.live
              ? async (endDate, reason) => {
                  const ok = await actions.endWorker(detailWorker.id, endDate, reason);
                  if (ok) toast.success(`${detailWorker.name}'s engagement ends ${endDate}`);
                  return ok;
                }
              : undefined
          }
          onSetCompliance={
            eor.live
              ? (key, status) => actions.setCompliance(detailWorker.id, key, COMPLIANCE_TO_API[status])
              : undefined
          }
        />
        <WorkerModal
          open={workerModalOpen}
          onClose={() => setWorkerModalOpen(false)}
          editingWorker={editingWorker}
          providers={providers}
          onSave={saveWorker}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <Globe2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Employer of Record
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage internationally-employed workers engaged through EOR providers.
          </p>
        </div>
      </div>

      <StatCards
        workers={workers}
        providers={providers}
        activeTab={activeTab}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {EOR_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              (
              {cardFilter === "active_providers"
                ? visibleProviders.length
                : visibleWorkers.length}
              )
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Show all
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "workers", label: `Workers (${visibleWorkers.length})` },
            {
              value: "providers",
              label: `Providers (${visibleProviders.length})`,
            },
            { value: "compliance", label: "Compliance" },
            { value: "billing", label: `Billing (${invoices.length})` },
          ]}
        />

        <TabsContent value="workers" className="mt-4">
          <WorkersTable
            workers={visibleWorkers}
            onView={(w) => setDetailId(w.id)}
            onEdit={openEditWorker}
            onDelete={deleteWorker}
            onAdd={openAddWorker}
          />
        </TabsContent>

        <TabsContent value="providers" className="mt-4">
          <ProvidersTable
            providers={visibleProviders}
            onEdit={openEditProvider}
            onDelete={deleteProvider}
            onAdd={openAddProvider}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ComplianceTable workers={workers} onView={(w) => setDetailId(w.id)} />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <InvoicesTable
            invoices={invoices}
            onNew={eor.live ? () => setInvoiceModal({ invoice: null }) : undefined}
            onEdit={eor.live ? (invoice) => setInvoiceModal({ invoice }) : undefined}
            onSettle={
              eor.live
                ? (inv) =>
                    setPrompt({
                      title: `Mark ${inv.providerName} ${inv.period} as paid?`,
                      inputLabel: "Paid on",
                      initialValue: new Date().toISOString().slice(0, 10),
                      confirmLabel: "Mark as paid",
                      onConfirm: (paidOn) => actions.settleInvoice(inv.id, paidOn),
                    })
                : undefined
            }
            onDelete={
              eor.live
                ? (inv) =>
                    setPrompt({
                      title: `Delete the ${inv.period} invoice from ${inv.providerName}?`,
                      confirmLabel: "Delete",
                      destructive: true,
                      onConfirm: () => actions.deleteInvoice(inv.id),
                    })
                : undefined
            }
          />
          <InvoiceModal
            open={!!invoiceModal}
            invoice={invoiceModal?.invoice ?? null}
            providers={providers}
            onClose={() => setInvoiceModal(null)}
            onSave={async (body, id) => {
              const ok = await actions.saveInvoice(body, id);
              if (ok) toast.success(id ? "Invoice saved" : "Invoice added");
              return ok;
            }}
          />
          <PromptDialog request={prompt} onClose={() => setPrompt(null)} />
        </TabsContent>
      </Tabs>

      <WorkerModal
        open={workerModalOpen}
        onClose={() => setWorkerModalOpen(false)}
        editingWorker={editingWorker}
        providers={providers}
        onSave={saveWorker}
      />
      <ProviderModal
        open={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        editingProvider={editingProvider}
        onSave={saveProvider}
      />
    </div>
  );
}
