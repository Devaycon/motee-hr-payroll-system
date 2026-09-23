/**
 * Starting workflow runs from the events that should start them.
 *
 * A comment in the workflow seeds claimed the preboarding trigger "already
 * fires from Recruitment when a candidate is hired". It did not: nothing
 * evaluated a trigger anywhere, and `triggerMode: "automatic"` was decorative.
 * This is the evaluation.
 *
 * Middleware rather than call sites, for three concrete reasons: a recruitment
 * run starts when a chain *completes*, which is an outcome inside the approvals
 * reducer that only a post-dispatch read of state can see; `moveStage` has six
 * dispatch sites; and onboarding `addRecord`/`addRecords` has four. Duplicating
 * the trigger across ten handlers guarantees one gets missed.
 */
import {
  createListenerMiddleware,
  isAnyOf,
  type Dispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { Workflow } from "@/src/lib/types/workflows";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";
import type { WorkflowRun } from "@/src/lib/types/workflow-runs";
import type { RunContext } from "@/src/components/hr/workflows/run";
import {
  buildRun,
  runIdFor,
  type RunOverrides,
} from "@/src/lib/workflows/build-run";
import { tasksFromRun } from "@/src/components/hr/onboarding/instantiate";
import { runStarted, runTaskAssigned } from "@/src/lib/notifications/workflow-runs";
import { startRun } from "./workflow-runs-slice";
import { pushNotification } from "./notifications-slice";
import { approveStep } from "./approvals-slice";
import { linkEmployeeRecord, moveStage } from "./recruitment-slice";
import {
  addRecord,
  addRecords,
  approveTask,
  attachRun,
} from "./onboarding-records-slice";
import { hasAcceptedOffer } from "@/src/lib/types/recruitment";

export const workflowRunsListener = createListenerMiddleware();

const RECRUITMENT_WF = "WF-DEFAULT-RECRUITMENT";
const PREBOARDING_WF = "WF-DEFAULT-PREBOARDING";
const ONBOARDING_WF = "WF-DEFAULT-ONBOARDING";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function workflowById(state: RootState, id: string): Workflow | undefined {
  return state.workflows.workflows.find(
    (w) => w.id === id && w.status !== "archived",
  );
}

function runExists(state: RootState, country: string, runId: string): boolean {
  return (state.workflowRuns.byCountry[country] ?? []).some((r) => r.id === runId);
}

/**
 * Requisitions name their hiring team as free text, so matching on the name is
 * the only way to turn "Adaeze Okafor" into an assignable person. Worth doing:
 * without it every hiring role resolves through `linkedEmployeeId`, which in
 * the demo bundle points three of them at the same employee, and a three-step
 * handover visibly lands on one human three times.
 */
function overrideFor(
  roleId: string,
  name: string | undefined,
  employees: LocaleEmployee[],
): RunOverrides {
  if (!name) return {};
  const match = employees.find(
    (e) => e.fullName.toLowerCase() === name.trim().toLowerCase(),
  );
  return match ? { [roleId]: { employeeId: match.id, name: match.fullName } } : {};
}

function actorName(state: RootState): string {
  return state.auth.user?.name ?? "System";
}

/**
 * Save the run, then tell the people whose tasks just opened - and nobody
 * else. A workflow that assigns work to someone who is never told is a
 * document.
 */
function launch(
  dispatch: Dispatch<UnknownAction>,
  country: string,
  run: WorkflowRun,
): void {
  dispatch(startRun({ country, run }));
  const starting = run.tasks.filter((t) => t.status === "not_started");
  dispatch(pushNotification(runStarted(run, starting.length)));
  for (const task of starting) {
    dispatch(pushNotification(runTaskAssigned(run, task)));
  }
}

// Recruitment: an approved requisition starts the hiring work.
workflowRunsListener.startListening({
  actionCreator: approveStep,
  effect: async (action, api) => {
    const state = api.getState() as RootState;
    const request = state.approvals.requests.find(
      (r) => r.id === action.payload.requestId,
    );
    if (!request || request.status !== "approved") return;
    if (request.documentType !== "job_requisition") return;

    const country = state.locale.country;
    const workflow = workflowById(state, RECRUITMENT_WF);
    if (!workflow) return;

    const requisition = (state.requisitions.byCountry[country] ?? []).find(
      (r) => r.id === request.documentId,
    );
    if (!requisition) return;
    if (runExists(state, country, runIdFor(workflow.id, requisition.id))) return;

    const employees = state.locale.data?.employees ?? [];

    launch(
      api.dispatch,
      country,
      buildRun({
        workflow,
        subject: {
          kind: "requisition",
          id: requisition.id,
          name: requisition.title,
          href: "/talent/requisition",
        },
        anchorDate: today(),
        context: {},
        roles: state.locale.data?.roles ?? [],
        employees,
        startedBy: actorName(state),
        trigger: "recruitment_initiated",
        overrides: {
          ...overrideFor("ROLE-RECRUIT", requisition.recruiter, employees),
          ...overrideFor("ROLE-MGR", requisition.hiringManager, employees),
          ...overrideFor("ROLE-HRMGR", requisition.hrBusinessPartner, employees),
        },
      }),
    );
  },
});

// Preboarding: a hired candidate starts pre-employment.
workflowRunsListener.startListening({
  actionCreator: moveStage,
  effect: async (action, api) => {
    if (action.payload.stage !== "hired") return;
    const state = api.getState() as RootState;
    const country = action.payload.country;
    const bucket = state.recruitment.byCountry[country];
    const workflow = workflowById(state, PREBOARDING_WF);
    if (!bucket || !workflow) return;

    const employees = state.locale.data?.employees ?? [];

    for (const id of action.payload.ids) {
      const candidate = bucket.candidates.find((c) => c.id === id);
      if (!candidate || !hasAcceptedOffer(candidate)) continue;
      if (runExists(state, country, runIdFor(workflow.id, candidate.id))) continue;

      const vacancy = bucket.requisitions.find(
        (r) => r.id === candidate.requisitionId,
      );

      // Conditional tasks are evaluated against the hire's own facts, so
      // shipping a laptop to a home address only appears for a remote worker.
      const context: RunContext = {
        remote_worker: vacancy?.advert?.workMode === "remote",
        contractor: vacancy?.employmentType === "contract",
      };

      launch(
        api.dispatch,
        country,
        buildRun({
          workflow,
          subject: {
            kind: "candidate",
            id: candidate.id,
            name: candidate.name,
            href: `/talent/recruitment/${candidate.requisitionId}?candidate=${candidate.id}`,
          },
          // Preboarding offsets are written relative to day one, so the start
          // date is the anchor, not today.
          anchorDate: vacancy?.targetStartDate ?? today(),
          context,
          roles: state.locale.data?.roles ?? [],
          employees,
          startedBy: actorName(state),
          trigger: "preboarding_initiated",
          overrides: {
            ...overrideFor("ROLE-MGR", vacancy?.hiringManager, employees),
            ...overrideFor("ROLE-RECRUIT", vacancy?.recruiter, employees),
          },
        }),
      );
    }
  },
});

// Onboarding: a new record gets its real task list.
workflowRunsListener.startListening({
  matcher: isAnyOf(addRecord, addRecords),
  effect: async (action, api) => {
    const state = api.getState() as RootState;
    const country = state.locale.country;
    const workflow = workflowById(state, ONBOARDING_WF);
    if (!workflow) return;

    const created: OnboardingRecord[] = addRecords.match(action)
      ? action.payload
      : [(action as ReturnType<typeof addRecord>).payload];

    const employees = state.locale.data?.employees ?? [];

    for (const incoming of created) {
      const record = state.onboardingRecords.records.find(
        (r) => r.id === incoming.id,
      );
      // Missing means it was de-duplicated on the way in; a runId means a run
      // is already attached.
      if (!record || record.runId) continue;
      if (runExists(state, country, runIdFor(workflow.id, record.id))) continue;

      const run = buildRun({
        workflow,
        subject: {
          kind: "onboarding_record",
          id: record.id,
          name: record.employeeName,
          href: `/talent/onboarding/${record.id}`,
        },
        anchorDate: record.startDate || today(),
        context: {},
        roles: state.locale.data?.roles ?? [],
        employees,
        startedBy: actorName(state),
        trigger: "onboarding_initiated",
      });

      launch(api.dispatch, country, run);
      api.dispatch(
        attachRun({ recordId: record.id, runId: run.id, tasks: tasksFromRun(run) }),
      );
    }
  },
});

/**
 * Close the loop back to the candidate once a hire clears into Employees.
 *
 * `Candidate.createdEmployeeId` and the `linkEmployeeRecord` reducer both
 * existed, and the reducer was never dispatched from anywhere - so the
 * documented "Applicant -> Offer -> Hired -> Onboarding -> Employee chain can
 * be followed in either direction" only ever worked forwards, and an employee
 * record could not say which vacancy it came from.
 *
 * Completion is detected by comparing before and after rather than by asking
 * the caller: `approveTask` removes the record from `records` the moment the
 * last required task is signed off, so its disappearance *is* the event.
 */
workflowRunsListener.startListening({
  actionCreator: approveTask,
  effect: async (action, api) => {
    const before = api.getOriginalState() as RootState;
    const after = api.getState() as RootState;
    const { recordId } = action.payload;

    const record = before.onboardingRecords.records.find((r) => r.id === recordId);
    if (!record) return;
    const stillOpen = after.onboardingRecords.records.some((r) => r.id === recordId);
    if (stillOpen) return;

    // Records created from the pipeline are keyed `onb-<candidateId>`; a
    // manually entered hire has no candidate behind it, and the reducer
    // no-ops on an id it cannot find.
    if (!recordId.startsWith("onb-")) return;
    const candidateId = recordId.slice(4);
    const country = after.locale.country;
    const exists = (after.recruitment.byCountry[country]?.candidates ?? []).some(
      (c) => c.id === candidateId,
    );
    if (!exists) return;

    api.dispatch(
      linkEmployeeRecord({
        country,
        candidateId,
        // Mirrors `toRow` in lib/demo/pending-employees.
        employeeId: `emp-${recordId}`,
      }),
    );
  },
});
