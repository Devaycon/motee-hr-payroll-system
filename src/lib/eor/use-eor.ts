"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import {
  isServerId,
  useIsLive,
  useLiveSender,
  usePeopleDirectory,
} from "@/src/lib/live/use-is-live";
import {
  complianceFromApi,
  complianceKeyToApi,
  invoiceFromApi,
  providerFromApi,
  providerToRequest,
  workerFromApi,
  workerToRequest,
} from "./api-mapping";
import { useGetAllEorWorkersQuery } from "@/src/store/services/collections";
import {
  useCreateEorProviderMutation,
  useCreateEorWorkerMutation,
  useDeleteEorProviderMutation,
  useDeleteEorWorkerMutation,
  useGetEorInvoicesQuery,
  useGetEorProvidersQuery,
  useUpdateEorProviderMutation,
  useUpdateEorWorkerMutation,
  useEndEorWorkerMutation,
  useUpdateEorWorkerComplianceMutation,
  useCreateEorInvoiceMutation,
  useUpdateEorInvoiceMutation,
  useDeleteEorInvoiceMutation,
  useSettleEorInvoiceMutation,
  useGetEorComplianceQuery,
} from "@/src/store/services/eor";
import type {
  EorComplianceItem,
  EorComplianceKey,
  EorInvoice,
  EorProvider,
  EorWorker,
} from "@/src/lib/types/eor";
import type { ComplianceState, EorInvoiceRequest } from "@/src/types/eor";

/** EOR workers, providers and invoices; all null signed out. */
export function useLiveEor() {
  const live = useIsLive();
  const people = usePeopleDirectory();
  const workersQ = useGetAllEorWorkersQuery(undefined, { skip: !live });
  const providersQ = useGetEorProvidersQuery(undefined, { skip: !live });
  const invoicesQ = useGetEorInvoicesQuery(undefined, { skip: !live });
  // The compliance board (GET /eor/compliance): each engagement's checklist.
  const complianceQ = useGetEorComplianceQuery(undefined, { skip: !live });
  const compliance = useMemo<Map<string, EorComplianceItem[]> | null>(
    () =>
      complianceQ.data?.data
        ? new Map(complianceQ.data.data.map((r) => [r.engagementId, r.items.map(complianceFromApi)]))
        : null,
    [complianceQ.data],
  );
  const workers = useMemo<EorWorker[] | null>(
    () => (workersQ.data ? workersQ.data.map((w) => workerFromApi(w, people.byId.get(w.employeeId))) : null),
    [workersQ.data, people],
  );
  const providers = useMemo<EorProvider[] | null>(
    () => (providersQ.data?.data ? providersQ.data.data.map(providerFromApi) : null),
    [providersQ.data],
  );
  const invoices = useMemo<EorInvoice[] | null>(
    () => (invoicesQ.data?.data ? invoicesQ.data.data.map(invoiceFromApi) : null),
    [invoicesQ.data],
  );
  // The compliance board is the fresher checklist; lay it over each worker.
  const withCompliance = useMemo<EorWorker[] | null>(
    () =>
      workers && compliance
        ? workers.map((w) => (compliance.has(w.id) ? { ...w, compliance: compliance.get(w.id)! } : w))
        : workers,
    [workers, compliance],
  );
  return { live, workers: withCompliance, providers, invoices };
}

/** Sends the EOR page's changes to the API (no-ops signed out). */
export function useEorActions() {
  const live = useIsLive();
  const send = useLiveSender(["Eor"]);
  const people = usePeopleDirectory();
  const [createWorker] = useCreateEorWorkerMutation();
  const [updateWorker] = useUpdateEorWorkerMutation();
  const [deleteWorker] = useDeleteEorWorkerMutation();
  const [createProvider] = useCreateEorProviderMutation();
  const [updateProvider] = useUpdateEorProviderMutation();
  const [deleteProvider] = useDeleteEorProviderMutation();
  const [endWorker] = useEndEorWorkerMutation();
  const [setCompliance] = useUpdateEorWorkerComplianceMutation();
  const [createInvoice] = useCreateEorInvoiceMutation();
  const [updateInvoice] = useUpdateEorInvoiceMutation();
  const [deleteInvoice] = useDeleteEorInvoiceMutation();
  const [settleInvoice] = useSettleEorInvoiceMutation();
  const done = Promise.resolve(true);

  return useMemo(
    () => ({
      live,
      saveWorker: (w: EorWorker) => {
        if (!live) return done;
        // An engagement is for an existing employee: matched by email, then name.
        const employeeId =
          people.list.find((e) => w.email && e.email?.toLowerCase() === w.email.toLowerCase())?.id ??
          people.idOf(w.name) ??
          people.idOf(`${w.legalFirstName} ${w.legalLastName}`);
        if (!employeeId) {
          toast.error("Add this person as an employee first: an EOR engagement needs an employee record.");
          return Promise.resolve(false);
        }
        const body = workerToRequest(w, employeeId);
        return isServerId(w.id)
          ? send(() => updateWorker({ id: w.id, body }).unwrap(), "Could not save the EOR worker.")
          : send(() => createWorker(body).unwrap(), "Could not add the EOR worker.");
      },
      deleteWorker: (id: string) =>
        live && isServerId(id)
          ? send(() => deleteWorker(id).unwrap(), "Could not remove the EOR worker.")
          : done,
      saveProvider: (p: EorProvider) => {
        if (!live) return done;
        const body = providerToRequest(p);
        return isServerId(p.id)
          ? send(() => updateProvider({ id: p.id, body }).unwrap(), "Could not save the provider.")
          : send(() => createProvider(body).unwrap(), "Could not add the provider.");
      },
      deleteProvider: (id: string) =>
        live && isServerId(id)
          ? send(() => deleteProvider(id).unwrap(), "Could not remove the provider.")
          : done,
      /** POST /eor/workers/{id}/end */
      endWorker: (id: string, endDate: string, reason?: string) =>
        send(
          () => endWorker({ id, body: { endDate, reason: reason || null } }).unwrap(),
          "Could not end the engagement.",
        ),
      /** PUT /eor/workers/{id}/compliance/{key} */
      setCompliance: (id: string, key: EorComplianceKey, state: ComplianceState, note?: string) =>
        send(
          () =>
            setCompliance({
              id,
              key: complianceKeyToApi(key),
              body: { state, note: note || null },
            }).unwrap(),
          "Could not update the compliance item.",
        ),
      /** POST /eor/invoices or PUT /eor/invoices/{id} */
      saveInvoice: (body: EorInvoiceRequest, id?: string) =>
        send(
          () => (id ? updateInvoice({ id, body }) : createInvoice(body)).unwrap(),
          "Could not save the invoice.",
        ),
      deleteInvoice: (id: string) =>
        send(() => deleteInvoice(id).unwrap(), "Could not delete the invoice."),
      /** POST /eor/invoices/{id}/settle */
      settleInvoice: (id: string, paidOn: string) =>
        send(() => settleInvoice({ id, body: { paidOn } }).unwrap(), "Could not mark the invoice paid."),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, send, people, createWorker, updateWorker, deleteWorker, createProvider, updateProvider, deleteProvider, endWorker, setCompliance, createInvoice, updateInvoice, deleteInvoice, settleInvoice],
  );
}
