/**
 * Keeps Sickness & Absence derived state honest without every screen having
 * to remember to:
 *
 *  - Bradford scores are recalculated whenever an employee's sickness record
 *    changes (or the rules change), and a versioned snapshot is stored —
 *    the client's "bradford_scores" with calculation history.
 *  - Crossing into a review band opens an HR review case and notifies HR.
 *    It never takes action against the employee: the case asks a person to
 *    consider disability, pregnancy, adjustments and circumstances first.
 *  - Long-term absences and returns without an interview raise HR alerts.
 *  - Approval decisions in the Submissions hub flow back to the record.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import {
  approveStep,
  cancel as cancelApproval,
  rejectStep,
  returnToSender,
} from "./approvals-slice";
import { pushNotification } from "./notifications-slice";
import {
  openReviewCase,
  recordReturn,
  recordSnapshot,
  reportSickness,
  seedTenant,
  setApproval,
  setExclusion,
  setThresholds,
  sicknessId,
  updateRecord,
  updateSettings,
} from "./sickness-slice";
import { calculateBradford, spellLength } from "@/src/lib/sickness/bradford";
import { DEFAULT_SICKNESS_SETTINGS } from "@/src/lib/sickness/seeds";
import {
  BRADFORD_ACTION_LABELS,
  type BradfordAction,
  type SicknessRecord,
} from "@/src/lib/types/sickness";

export const sicknessListener = createListenerMiddleware();

const HR_ROLES = ["ROLE-HRMGR", "ROLE-HRADMIN", "ROLE-SADMIN"];
const ACTION_RANK: Record<BradfordAction, number> = {
  monitor: 0,
  manager_review: 1,
  formal_review: 2,
  senior_hr_review: 3,
};

const today = () => new Date().toISOString().slice(0, 10);

function employeesFor(state: RootState, tenantId: string) {
  const bundle = state.locale.data;
  if (!bundle || bundle.tenant.id !== tenantId) return null;
  return {
    byId: new Map(bundle.employees.map((e) => [e.id, e])),
    holidays: (bundle.events ?? []).filter((e) => e.type === "holiday").map((e) => e.start.slice(0, 10)),
  };
}

/** Recalculate and snapshot one employee; open a review case if they crossed a band. */
function rescore(
  state: RootState,
  dispatch: (a: unknown) => unknown,
  tenantId: string,
  employeeId: string,
  trigger: string,
  notify: boolean,
) {
  const ctx = employeesFor(state, tenantId);
  const settings = state.sickness.settings[tenantId] ?? DEFAULT_SICKNESS_SETTINGS;
  const records = state.sickness.records.filter((r) => r.tenantId === tenantId && r.employeeId === employeeId);
  const emp = ctx?.byId.get(employeeId);
  const result = calculateBradford({
    employeeId,
    records,
    asOf: today(),
    settings: settings.bradford,
    schedule: emp?.workPattern?.schedule,
    holidays: ctx?.holidays,
  });
  const last = state.sickness.snapshots.find((s) => s.tenantId === tenantId && s.employeeId === employeeId);
  const changed =
    !last ||
    last.score !== result.score ||
    last.episodes !== result.S ||
    last.days !== result.D ||
    last.calcVersion !== result.calcVersion;
  if (changed) {
    dispatch(
      recordSnapshot({
        id: sicknessId("BFS"),
        tenantId,
        employeeId,
        computedAt: new Date().toISOString(),
        windowStart: result.windowStart,
        windowEnd: result.windowEnd,
        episodes: result.S,
        days: result.D,
        score: result.score,
        action: result.action,
        calcVersion: result.calcVersion,
        trigger,
      }),
    );
  }

  const prevRank = last ? ACTION_RANK[last.action] : 0;
  const rank = ACTION_RANK[result.action];
  const open = state.sickness.reviewCases.some(
    (c) => c.employeeId === employeeId && c.tenantId === tenantId && c.trigger === "bradford_threshold" && c.status !== "closed",
  );
  if (rank > 0 && (rank > prevRank || !last) && !open) {
    const name = records[0]?.employeeName ?? emp?.fullName ?? "Employee";
    dispatch(
      openReviewCase({
        actor: "System",
        case: {
          id: sicknessId("ARC"),
          tenantId,
          employeeId,
          employeeName: name,
          trigger: "bradford_threshold",
          action: result.action,
          scoreAtOpen: result.score,
          status: "open",
          openedAt: new Date().toISOString(),
          owner: rank >= 3 ? "Senior HR" : rank >= 2 ? "HR Manager" : "Line manager",
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          recordIds: result.episodes.flatMap((e) => e.recordIds),
          considerations: { disability: false, pregnancy: false, adjustments: false, otherCircumstances: false },
        },
      }),
    );
    if (notify) {
      dispatch(
        pushNotification({
          title: "Attendance review suggested",
          description: `${name}'s Bradford score is ${result.score} — ${BRADFORD_ACTION_LABELS[result.action].toLowerCase()}.`,
          detail: "A human review is required. Consider disability, pregnancy, adjustments and other circumstances before any action.",
          type: "warning",
          recipientRoleIds: HR_ROLES,
          href: `/time-payroll/sickness/bradford?employee=${employeeId}`,
        }),
      );
    }
  }
}

// Recalculate when a record changes.
sicknessListener.startListening({
  matcher: isAnyOf(reportSickness, updateRecord, setApproval, setExclusion, recordReturn),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const p = action.payload as { record?: SicknessRecord; id?: string; actor: string };
    const record = p.record ?? state.sickness.records.find((r) => r.id === p.id);
    if (!record) return;
    rescore(state, api.dispatch, record.tenantId, record.employeeId, action.type.replace("sickness/", ""), true);

    // Long-term absence: suggest an OH referral to HR once the spell passes the trigger.
    const settings = state.sickness.settings[record.tenantId] ?? DEFAULT_SICKNESS_SETTINGS;
    if (record.absenceState === "ongoing" && spellLength(record, today()) >= settings.ohTriggerDays && !record.ohReferralId) {
      api.dispatch(
        openReviewCase({
          actor: "System",
          case: {
            id: sicknessId("ARC"),
            tenantId: record.tenantId,
            employeeId: record.employeeId,
            employeeName: record.employeeName,
            trigger: "long_term",
            status: "open",
            openedAt: new Date().toISOString(),
            owner: "HR Manager",
            recordIds: [record.id],
            considerations: { disability: false, pregnancy: false, adjustments: false, otherCircumstances: false },
          },
        }),
      );
    }

    if (action.type === recordReturn.type && record.rtw.status !== "completed") {
      api.dispatch(
        pushNotification({
          title: "Return-to-work interview needed",
          description: `${record.employeeName} is back at work. Hold and record their return-to-work interview.`,
          type: "calendar",
          recipientRoleIds: HR_ROLES,
          recipientEmployeeIds: record.managerId ? [record.managerId] : undefined,
          href: `/time-payroll/sickness/return-to-work`,
        }),
      );
    }
  },
});

// Seeding and rule changes rescore everyone in the tenant, quietly.
sicknessListener.startListening({
  matcher: isAnyOf(seedTenant, updateSettings, setThresholds),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const tenantId = (action.payload as { tenantId: string }).tenantId;
    const ids = new Set(state.sickness.records.filter((r) => r.tenantId === tenantId).map((r) => r.employeeId));
    for (const id of ids) {
      rescore(api.getState() as RootState, api.dispatch, tenantId, id, action.type === seedTenant.type ? "initial calculation" : "rules changed", false);
    }
  },
});

// Approval decisions in the Submissions hub → the sickness record.
sicknessListener.startListening({
  matcher: isAnyOf(approveStep, rejectStep, returnToSender, cancelApproval),
  effect: (action, api) => {
    const state = api.getState() as RootState;
    const requestId = (action.payload as { requestId?: string }).requestId;
    const req = state.approvals.requests.find((r) => r.id === requestId);
    if (!req || req.documentType !== "sickness_absence") return;
    const status =
      req.status === "approved" ? "approved" : req.status === "rejected" ? "rejected" : req.status === "cancelled" ? "cancelled" : "awaiting_approval";
    const actor = (action.payload as { actorName?: string }).actorName ?? "Approver";
    api.dispatch(setApproval({ id: req.documentId, status, actor, note: `Approval chain: ${req.status}` }));
  },
});
