/**
 * Sends profile edits to the API.
 *
 * The profile screens record an edit as `applyEdit({ employeeId, field, value })`
 * from several places, one field at a time. Listening here rather than at each
 * call site means none can be missed, and lets a save that touches several
 * fields go out as a single update: `PUT /employees/{id}` replaces the whole
 * record, so separate requests racing each other would overwrite one another.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "./store";
import { applyEdit, approveRequest, clearOverrides } from "./profile-edits-slice";
import { employeeDtoToRequest } from "@/src/lib/employees/api-mapping";
import {
  applyFieldToRequest,
  isServerField,
  statusFromFieldValue,
} from "@/src/lib/employees/profile-field-sync";
import { getApiErrorMessage } from "@/src/lib/utils";
import { employeesApi } from "@/src/store/services/employees";
import { filesApi } from "@/src/store/services/files";

interface FieldEdit {
  field: string;
  value: string;
}

/** Long enough to gather every field of one form save, too short to notice. */
const BATCH_WINDOW_MS = 40;

const queued = new Map<string, FieldEdit[]>();

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const extension = blob.type.split("/")[1] ?? "png";
  return new File([blob], `${name}.${extension}`, { type: blob.type });
}

async function pushEdits(
  employeeId: string,
  edits: FieldEdit[],
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<void> {
  const readCurrent = dispatch(
    employeesApi.endpoints.getEmployee.initiate(employeeId, {
      forceRefetch: true,
    }),
  );
  let current;
  try {
    current = (await readCurrent.unwrap()).data;
  } finally {
    readCurrent.unsubscribe();
  }

  const body = employeeDtoToRequest(current);
  const departments = getState().locale.data?.departments ?? [];
  let bodyChanged = false;

  for (const { field, value } of edits) {
    if (field === "status") {
      const status = statusFromFieldValue(value);
      if (status && status !== current.status) {
        await dispatch(
          employeesApi.endpoints.changeEmployeeStatus.initiate({
            id: employeeId,
            body: { status },
          }),
        ).unwrap();
      }
    } else if (field === "photoUrl") {
      if (!value.startsWith("data:")) continue;
      await dispatch(
        filesApi.endpoints.uploadFile.initiate({
          file: await dataUrlToFile(value, "avatar"),
          purpose: "employeeAvatar",
          ownerId: employeeId,
        }),
      ).unwrap();
    } else if (applyFieldToRequest(body, field, value, { departments })) {
      bodyChanged = true;
    } else {
      toast.error(`"${value}" could not be saved for ${field}.`);
    }
  }

  if (bodyChanged) {
    await dispatch(
      employeesApi.endpoints.updateEmployee.initiate({ id: employeeId, body }),
    ).unwrap();
  }

  // Wait for the refreshed record before dropping the local copy of the edit,
  // so the screen never flickers back to the old value in between.
  const refresh = dispatch(
    employeesApi.endpoints.getEmployee.initiate(employeeId, {
      forceRefetch: true,
    }),
  );
  await refresh;
  refresh.unsubscribe();
}

export const profileEditsListener = createListenerMiddleware();

profileEditsListener.startListening({
  matcher: isAnyOf(applyEdit, approveRequest),
  effect: async (action, listenerApi) => {
    const getState = listenerApi.getState as () => RootState;
    const dispatch = listenerApi.dispatch as AppDispatch;

    let employeeId: string;
    let edit: FieldEdit;
    if (applyEdit.match(action)) {
      employeeId = action.payload.employeeId;
      edit = { field: action.payload.field, value: action.payload.value };
    } else if (approveRequest.match(action)) {
      // An approved change request becomes an edit like any other.
      const request = getState().profileEdits.requests.find(
        (r) => r.id === action.payload.id,
      );
      if (!request || request.status !== "approved") return;
      employeeId = request.employeeId;
      edit = { field: request.field, value: request.requestedValue };
    } else {
      return;
    }

    if (!isServerField(edit.field)) return;

    const batch = queued.get(employeeId);
    if (batch) {
      batch.push(edit);
      return;
    }
    queued.set(employeeId, [edit]);
    await listenerApi.delay(BATCH_WINDOW_MS);
    const edits = queued.get(employeeId) ?? [];
    queued.delete(employeeId);

    try {
      await pushEdits(employeeId, edits, dispatch, getState);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the change."));
    } finally {
      // Saved or refused, the server's copy is now what the screen should show.
      dispatch(
        clearOverrides({ employeeId, fields: edits.map((e) => e.field) }),
      );
    }
  },
});
