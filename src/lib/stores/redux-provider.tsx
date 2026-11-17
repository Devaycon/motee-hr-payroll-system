"use client";

import { useSyncExternalStore } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { hydrateCountry, loadLocale } from "./locale-slice";
import { readStoredCountry } from "@/src/lib/locale/country-storage";
import { initAccessLevelsPersistence } from "./access-levels-persistence";
import { initApprovalsPersistence } from "./approvals-persistence";
import { initRecruitmentPersistence } from "./recruitment-persistence";
import { initWorkforceRequestsPersistence } from "./workforce-requests-persistence";
import { initProfileEditsPersistence } from "./profile-edits-persistence";
import { initCollectionEditsPersistence } from "./collection-edits-persistence";
import { initWorkflowsPersistence } from "./workflows-persistence";
import { initWorkflowRunsPersistence } from "./workflow-runs-persistence";
import { initLeavePersistence } from "./leave-persistence";
import { initEmployeesPersistence } from "./employees-persistence";
import { initScenariosPersistence } from "./scenarios-persistence";
import { initUsersPersistence } from "./users-persistence";
import { initDiversityPersistence } from "./diversity-persistence";
import { initProjectsPersistence } from "./projects-persistence";
import { initAttendancePersistence } from "./attendance-persistence";
import { initAttendanceDeductionPolicyPersistence } from "./attendance-deduction-policy-persistence";
import { initPresenceCheckPersistence } from "./presence-check-persistence";
import { initExpensesPersistence } from "./expenses-persistence";
import { initBranchPersistence } from "./branch-persistence";
import { initShiftsPersistence } from "./shifts-persistence";
import { initBenefitPlansPersistence } from "./benefit-plans-persistence";
import { initErCasesPersistence } from "./er-cases-persistence";
import { initRuntimePersistence } from "./runtime-persistence";
import { hydrateBranchPerformance } from "./branch-performance-slice";
import { hydrateSickness } from "./sickness-slice";
import { hydrateLeaveSchemes } from "./leave-schemes-slice";
import { hydrateWorkforceRisk } from "./workforce-risk-slice";
import { initPayrollPersistence } from "./payroll-persistence";

let booted = false;

/** Restores the country and starts every persistence layer, once per page. */
function boot() {
  if (booted) return;
  booted = true;
  {
    // First, before any persistence layer hydrates: restore the UK/Nigeria
    // context the user last picked and load that country's bundle. Every
    // `*-persistence.ts` key and runtime API call is namespaced by the same
    // stored country, so the whole app boots in one consistent context.
    const country = readStoredCountry();
    store.dispatch(hydrateCountry(country));
    void store.dispatch(loadLocale(country));

    initAccessLevelsPersistence();
    initApprovalsPersistence();
    initRecruitmentPersistence();
    initWorkforceRequestsPersistence();
    initProfileEditsPersistence();
    initCollectionEditsPersistence();
    initWorkflowsPersistence();
    initWorkflowRunsPersistence();
    initLeavePersistence();
    initEmployeesPersistence();
    // Offboarding intentionally does NOT persist across a refresh — every
    // reload reseeds fresh demo data from the locale bundle so the pipeline
    // is always in a clean, fully-populated state to test against.
    initScenariosPersistence();
    initUsersPersistence();
    initDiversityPersistence();
    initProjectsPersistence();
    initAttendancePersistence();
    initAttendanceDeductionPolicyPersistence();
    initPresenceCheckPersistence();
    initExpensesPersistence();
    initBranchPersistence();
    initShiftsPersistence();
    initBenefitPlansPersistence();
    initErCasesPersistence();
    initRuntimePersistence({
      key: "branch-performance",
      select: (s) => s.branchPerformance,
      hydrate: hydrateBranchPerformance,
    });
    initRuntimePersistence({
      key: "sickness",
      select: (s) => s.sickness,
      // A snapshot from an older seed version is ignored by the reducer.
      hydrate: hydrateSickness,
    });
    initRuntimePersistence({
      key: "leave-schemes",
      select: (s) => s.leaveSchemes,
      hydrate: hydrateLeaveSchemes,
    });
    initRuntimePersistence({
      key: "workforce-risk",
      select: (s) => s.workforceRisk,
      hydrate: hydrateWorkforceRisk,
    });
    // Payroll stays in this browser only: salaries and bank details must never
    // go through the shared, unauthenticated runtime API.
    initPayrollPersistence();
  }
}

const noopSubscribe = () => () => {};

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // The demo is client-only data (localStorage + lazily loaded bundles) and
  // the UK/Nigeria context lives in localStorage, which the server can't see.
  // Rendering nothing until the client has taken over means the server HTML
  // can never disagree with the client's country, and every screen mounts
  // with the country already restored.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (isClient) boot();

  return <Provider store={store}>{isClient ? children : null}</Provider>;
}
