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
} from "@/src/store/services/eor";
import type { EorInvoice, EorProvider, EorWorker } from "@/src/lib/types/eor";

/** EOR workers, providers and invoices; all null signed out. */
export function useLiveEor() {
  const live = useIsLive();
  const people = usePeopleDirectory();
  const workersQ = useGetAllEorWorkersQuery(undefined, { skip: !live });
  const providersQ = useGetEorProvidersQuery(undefined, { skip: !live });
  const invoicesQ = useGetEorInvoicesQuery(undefined, { skip: !live });
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
  return { live, workers, providers, invoices };
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, send, people, createWorker, updateWorker, deleteWorker, createProvider, updateProvider, deleteProvider],
  );
}
