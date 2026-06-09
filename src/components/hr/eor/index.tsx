"use client";

import { useState } from "react";
import { Globe2 } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { WorkersTable } from "./components/workers-table";
import { ProvidersTable } from "./components/providers-table";
import { ComplianceTable } from "./components/compliance-table";
import { InvoicesTable } from "./components/invoices-table";
import { WorkerModal } from "./components/worker-modal";
import { ProviderModal } from "./components/provider-modal";
import { WorkerDetail } from "./components/worker-detail";
import { EOR_WORKERS, EOR_PROVIDERS, EOR_INVOICES } from "./data";
import type { EorWorker, EorProvider } from "./types";

export function EorPage() {
  const [workers, setWorkers] = useState<EorWorker[]>(EOR_WORKERS);
  const [providers, setProviders] = useState<EorProvider[]>(EOR_PROVIDERS);

  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<EorWorker | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EorProvider | null>(null);

  // Derive the detail worker from state so edits reflect immediately.
  const detailWorker = workers.find((w) => w.id === detailId) ?? null;

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
    setWorkers((prev) => {
      const exists = prev.some((w) => w.id === worker.id);
      return exists
        ? prev.map((w) => (w.id === worker.id ? worker : w))
        : [worker, ...prev];
    });
  }
  function deleteWorker(id: string) {
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
    setProviders((prev) => {
      const exists = prev.some((p) => p.id === provider.id);
      return exists
        ? prev.map((p) => (p.id === provider.id ? provider : p))
        : [provider, ...prev];
    });
  }
  function deleteProvider(id: string) {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  if (detailWorker) {
    return (
      <>
        <WorkerDetail
          worker={detailWorker}
          provider={providers.find((p) => p.id === detailWorker.providerId)}
          onBack={() => setDetailId(null)}
          onEdit={() => openEditWorker(detailWorker)}
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

      <StatCards workers={workers} providers={providers} />

      <Tabs defaultValue="workers">
        <PageTabsList
          tabs={[
            { value: "workers", label: `Workers (${workers.length})` },
            { value: "providers", label: `Providers (${providers.length})` },
            { value: "compliance", label: "Compliance" },
            { value: "billing", label: `Billing (${EOR_INVOICES.length})` },
          ]}
        />

        <TabsContent value="workers" className="mt-4">
          <WorkersTable
            workers={workers}
            onView={(w) => setDetailId(w.id)}
            onEdit={openEditWorker}
            onDelete={deleteWorker}
            onAdd={openAddWorker}
          />
        </TabsContent>

        <TabsContent value="providers" className="mt-4">
          <ProvidersTable
            providers={providers}
            onEdit={openEditProvider}
            onDelete={deleteProvider}
            onAdd={openAddProvider}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ComplianceTable workers={workers} onView={(w) => setDetailId(w.id)} />
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          <InvoicesTable invoices={EOR_INVOICES} />
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
