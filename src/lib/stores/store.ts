import { configureStore } from "@reduxjs/toolkit";
import onboardingReducer from "./onboarding-slice";
import onboardingRecordsReducer from "./onboarding-records-slice";
import localeReducer from "./locale-slice";
import authReducer from "./auth-slice";
import accessLevelsReducer from "./access-levels-slice";
import approvalsReducer from "./approvals-slice";
import recruitmentReducer from "./recruitment-slice";
import workforceRequestsReducer from "./workforce-requests-slice";
import requisitionsReducer from "./requisitions-slice";
import profileEditsReducer from "./profile-edits-slice";
import collectionEditsReducer from "./collection-edits-slice";
import workflowsReducer from "./workflows-slice";
import scenariosReducer from "./scenarios-slice";
import usersReducer from "./users-slice";
import auditReducer from "./audit-slice";
import diversityReducer from "./diversity-slice";
import projectsReducer from "./projects-slice";
import leaveReducer from "./leave-slice";
import notificationsReducer from "./notifications-slice";
import employeesReducer from "./employees-slice";
import offboardingReducer from "./offboarding-slice";

export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    onboardingRecords: onboardingRecordsReducer,
    locale: localeReducer,
    auth: authReducer,
    accessLevels: accessLevelsReducer,
    approvals: approvalsReducer,
    recruitment: recruitmentReducer,
    workforceRequests: workforceRequestsReducer,
    requisitions: requisitionsReducer,
    profileEdits: profileEditsReducer,
    collectionEdits: collectionEditsReducer,
    workflows: workflowsReducer,
    scenarios: scenariosReducer,
    users: usersReducer,
    audit: auditReducer,
    diversity: diversityReducer,
    projects: projectsReducer,
    leave: leaveReducer,
    notifications: notificationsReducer,
    employees: employeesReducer,
    offboarding: offboardingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
