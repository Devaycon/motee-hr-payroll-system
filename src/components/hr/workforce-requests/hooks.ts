"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLiveDepartments } from "@/src/lib/hooks/use-live-departments";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  replaceCountryFromApi,
  type WorkforceRequest,
} from "@/src/lib/stores/workforce-requests-slice";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  workforceRequestFromApi,
  workforceRequestToApi,
  type WorkforceRequestForm,
} from "@/src/lib/workforce-requests/api-mapping";
import { useGetAllWorkforceRequestsQuery } from "@/src/store/services/collections";
import { useGetBusinessUnitsQuery } from "@/src/store/services/business-units";
import {
  useCancelWorkforceRequestMutation,
  useConvertWorkforceRequestMutation,
  useCreateWorkforceRequestMutation,
  useDeleteWorkforceRequestMutation,
  useLazyGetWorkforceRequestQuery,
  useSubmitWorkforceRequestMutation,
  useUpdateWorkforceRequestMutation,
} from "@/src/store/services/workforce-requests";

/**
 * Lays the server's workforce requests into the slice. The hire tracker, the
 * lifecycle view and the requisition builder read the slice too, so they all
 * follow the server from here.
 */
export function useWorkforceRequestsSync(): boolean {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const live = useAppSelector((s) => s.session.is_loggedIn);
  const { data } = useGetAllWorkforceRequestsQuery(undefined, { skip: !live });
  useEffect(() => {
    if (!data) return;
    dispatch(
      replaceCountryFromApi({ country, requests: data.map(workforceRequestFromApi) }),
    );
  }, [data, country, dispatch]);
  return live;
}

/** Each action resolves to the server's copy once it has accepted it, or null. */
export function useWorkforceRequestActions() {
  const { idByName } = useLiveDepartments();
  const businessUnits = useGetBusinessUnitsQuery().data?.data;
  const currency = useAppSelector((s) => s.locale.data?.tenant.currency);
  const [create] = useCreateWorkforceRequestMutation();
  const [update] = useUpdateWorkforceRequestMutation();
  const [remove] = useDeleteWorkforceRequestMutation();
  const [submitRequest] = useSubmitWorkforceRequestMutation();
  const [cancelRequest] = useCancelWorkforceRequestMutation();
  const [convertRequest] = useConvertWorkforceRequestMutation();
  const [load] = useLazyGetWorkforceRequestQuery();

  const guard = useCallback(
    async <T,>(call: () => Promise<{ data: T }>, failure: string): Promise<T | null> => {
      try {
        return (await call()).data;
      } catch (err) {
        toast.error(getApiErrorMessage(err, failure));
        return null;
      }
    },
    [],
  );

  const body = useCallback(
    (form: WorkforceRequestForm) =>
      workforceRequestToApi(form, {
        departmentId: idByName.get(form.department) ?? null,
        businessUnitId: businessUnits?.find((b) => b.name === form.businessUnit)?.id ?? null,
        currency,
      }),
    [idByName, businessUnits, currency],
  );

  return {
    save: (form: WorkforceRequestForm, editingId?: string | null) =>
      guard(
        () =>
          editingId
            ? update({ id: editingId, body: body(form) }).unwrap()
            : create(body(form)).unwrap(),
        "Could not save the workforce request.",
      ),
    submit: (id: string) =>
      guard(() => submitRequest(id).unwrap(), "Could not submit the request."),
    convert: (id: string) =>
      guard(() => convertRequest(id).unwrap(), "Could not create the requisition."),
    /** Re-reads one request so the detail view shows where it stands now. */
    refresh: async (wfr: WorkforceRequest): Promise<WorkforceRequest> => {
      const fresh = await load(wfr.id)
        .unwrap()
        .catch(() => null);
      return fresh?.data ? workforceRequestFromApi(fresh.data) : wfr;
    },
    /** Not on the approved screen yet; kept for when they are. */
    cancel: (id: string, reason: string) =>
      guard(() => cancelRequest({ id, body: { reason } }).unwrap(), "Could not cancel the request."),
    remove: (id: string) =>
      guard(() => remove(id).unwrap(), "Could not delete the request."),
  };
}
