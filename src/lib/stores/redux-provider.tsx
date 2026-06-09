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

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAccessLevelsPersistence();
    initApprovalsPersistence();
    initRecruitmentPersistence();
    initWorkforceRequestsPersistence();
    initProfileEditsPersistence();
    initCollectionEditsPersistence();
    initWorkflowsPersistence();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
