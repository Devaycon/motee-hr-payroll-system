"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
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

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
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
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
