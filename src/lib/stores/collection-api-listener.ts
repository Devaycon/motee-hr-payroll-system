/**
 * Sends employee-record edits made through the profile's record forms to the
 * API, for the collections that have an endpoint:
 *
 * - `employeeNotes` → `/employees/{employeeId}/notes`
 * - `learning.certifications` → `/certifications`
 *
 * The form writes its local copy first (collection-edits slice). Once the
 * server accepts the change the local copy is dropped (`settleRecord`) and the
 * collection is re-read, so the server's record shows. A refused change shows
 * the server's message; the local copy is dropped too, leaving the server's.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { employeeNotesApi } from "@/src/store/services/employee-notes";
import { certificationsApi } from "@/src/store/services/certifications";
import { getApiErrorMessage } from "@/src/lib/utils";
import { addRecord, removeRecord, settleRecord, updateRecord } from "./collection-edits-slice";
import type { CollectionRecord } from "./collection-edits-slice";
import type { EmployeeNoteRequest } from "@/src/types/employee-notes";
import type { CertificationRequest } from "@/src/types/certifications";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface SessionState {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  collectionEdits: { added: Record<string, CollectionRecord[]>; edits: Record<string, Record<string, Record<string, unknown>>> };
}

const KEYS = new Set(["employeeNotes", "learning.certifications"]);

function noteBody(r: Record<string, unknown>): EmployeeNoteRequest {
  return {
    body: String(r.body ?? ""),
    kind: r.type === "reminder" ? "reminder" : "note",
    audience: r.visibility === "manager_and_hr" ? "managerAndHr" : "hrOnly",
    pinned: !!r.pinned,
    remindAt: r.type === "reminder" && r.remindAt ? String(r.remindAt) : null,
  };
}

function certBody(r: Record<string, unknown>): CertificationRequest {
  return {
    employeeId: String(r.employeeId ?? ""),
    title: String(r.title ?? ""),
    issuingBody: (r.issuingBody as string) || null,
    category: (r.category as string) || null,
    credentialId: (r.credentialId as string) || null,
    issuedOn: String(r.issuedAt ?? new Date().toISOString().slice(0, 10)),
    expiresOn: (r.expiresAt as string) || null,
  };
}

export const collectionApiListener = createListenerMiddleware();

collectionApiListener.startListening({
  matcher: isAnyOf(addRecord, updateRecord, removeRecord),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as SessionState;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const { key } = action.payload as { key: string };
    if (!KEYS.has(key)) return;
    const dispatch = listenerApi.dispatch;

    // The full record as it stands locally (added this session, or patched).
    let id: string;
    let record: Record<string, unknown>;
    if (addRecord.match(action)) {
      record = action.payload.record;
      id = String(record.id ?? "");
    } else if (updateRecord.match(action)) {
      id = action.payload.id;
      const added = state.collectionEdits.added[key]?.find((r) => r.id === id);
      record = { ...(added ?? {}), ...(state.collectionEdits.edits[key]?.[id] ?? {}), ...action.payload.patch };
    } else {
      id = (action.payload as { id: string }).id;
      record = {};
    }

    const tag = key === "employeeNotes" ? "EmployeeNotes" : "Certifications";
    const resync = () => {
      dispatch(settleRecord({ key, id }));
      dispatch(api.util.invalidateTags([tag]));
    };

    try {
      if (key === "employeeNotes") {
        const employeeId = String(record.employeeId ?? "");
        if (removeRecord.match(action)) {
          if (!isServerId(id)) return;
          // The note's owner is needed for the URL: read it from the cache.
          const owner = findNoteOwner(listenerApi.getState(), id);
          if (!owner) return;
          await dispatch(employeeNotesApi.endpoints.deleteEmployeeNote.initiate({ employeeId: owner, noteId: id })).unwrap();
        } else if (isServerId(id)) {
          const owner = employeeId || findNoteOwner(listenerApi.getState(), id);
          if (!owner) return;
          await dispatch(
            employeeNotesApi.endpoints.updateEmployeeNote.initiate({
              employeeId: owner,
              noteId: id,
              body: noteBody({ ...findNote(listenerApi.getState(), id), ...record }),
            }),
          ).unwrap();
        } else {
          if (!isServerId(employeeId)) return;
          await dispatch(
            employeeNotesApi.endpoints.addEmployeeNote.initiate({ employeeId, body: noteBody(record) }),
          ).unwrap();
        }
      } else {
        if (removeRecord.match(action)) {
          if (!isServerId(id)) return;
          await dispatch(certificationsApi.endpoints.deleteCertification.initiate(id)).unwrap();
        } else if (isServerId(id)) {
          await dispatch(
            certificationsApi.endpoints.updateCertification.initiate({ id, body: certBody(record) }),
          ).unwrap();
        } else {
          if (!isServerId(record.employeeId)) return;
          await dispatch(certificationsApi.endpoints.createCertification.initiate(certBody(record))).unwrap();
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the change."));
    }
    resync();
  },
});

/** Every cached `GET /employees/{id}/notes` result, flattened. */
function cachedNotes(state: unknown): { id: string; employeeId: string }[] {
  const queries = (state as { api?: { queries?: Record<string, { endpointName?: string; data?: unknown }> } }).api?.queries ?? {};
  return Object.values(queries)
    .filter((q) => q?.endpointName === "getEmployeeNotes")
    .flatMap((q) => ((q.data as { data?: { id: string; employeeId: string }[] })?.data ?? []));
}
function findNoteOwner(state: unknown, id: string): string | undefined {
  return cachedNotes(state).find((n) => n.id === id)?.employeeId;
}
function findNote(state: unknown, id: string): Record<string, unknown> {
  const dto = cachedNotes(state).find((n) => n.id === id) as Record<string, unknown> | undefined;
  if (!dto) return {};
  return {
    employeeId: dto.employeeId,
    body: dto.body,
    type: dto.kind,
    visibility: dto.audience === "managerAndHr" ? "manager_and_hr" : "hr_only",
    pinned: dto.pinned,
    remindAt: dto.remindAt,
  };
}
