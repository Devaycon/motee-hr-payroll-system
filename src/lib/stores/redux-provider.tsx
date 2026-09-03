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
import { initLeavePersistence } from "./leave-persistence";
import { initEmployeesPersistence } from "./employees-persistence";
import { initOffboardingPersistence } from "./offboarding-persistence";
import { initScenariosPersistence } from "./scenarios-persistence";
import { initUsersPersistence } from "./users-persistence";
import { initDiversityPersistence } from "./diversity-persistence";
import { initProjectsPersistence } from "./projects-persistence";
import { initAttendancePersistence } from "./attendance-persistence";
import { initExpensesPersistence } from "./expenses-persistence";
import { initDashboardLayoutPersistence } from "./dashboard-layout-persistence";
import { initBranchPersistence } from "./branch-persistence";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAccessLevelsPersistence();
    initApprovalsPersistence();
    initRecruitmentPersistence();
    initWorkforceRequestsPersistence();
    initProfileEditsPersistence();
    initCollectionEditsPersistence();
    initWorkflowsPersistence();
    initLeavePersistence();
    initEmployeesPersistence();
    initOffboardingPersistence();
    initScenariosPersistence();
    initUsersPersistence();
    initDiversityPersistence();
    initProjectsPersistence();
    initAttendancePersistence();
    initExpensesPersistence();
    initDashboardLayoutPersistence();
    initBranchPersistence();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
