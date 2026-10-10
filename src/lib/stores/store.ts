import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistStore,
} from "redux-persist";
import api from "@/src/store/services/api";
import sessionReducer from "@/src/store/reducers/authSlice";
import onboardingReducer from "./onboarding-slice";
import onboardingRecordsReducer from "./onboarding-records-slice";
import localeReducer from "./locale-slice";
import branchReducer from "./branch-slice";
import authReducer from "./auth-slice";
import accessLevelsReducer from "./access-levels-slice";
import approvalsReducer from "./approvals-slice";
import recruitmentReducer from "./recruitment-slice";
import workforceRequestsReducer from "./workforce-requests-slice";
import requisitionsReducer from "./requisitions-slice";
import profileEditsReducer from "./profile-edits-slice";
import collectionEditsReducer from "./collection-edits-slice";
import workflowsReducer from "./workflows-slice";
import workflowRunsReducer from "./workflow-runs-slice";
import { workflowRunsListener } from "./workflow-runs-listener";
import { profileEditsListener } from "./profile-edits-listener";
import { offboardingListener } from "./offboarding-listener";
import { leaveListener } from "./leave-listener";
import scenariosReducer from "./scenarios-slice";
import usersReducer from "./users-slice";
import auditReducer from "./audit-slice";
import diversityReducer from "./diversity-slice";
import projectsReducer from "./projects-slice";
import leaveReducer from "./leave-slice";
import notificationsReducer from "./notifications-slice";
import employeesReducer from "./employees-slice";
import offboardingReducer from "./offboarding-slice";
import attendanceReducer from "./attendance-slice";
import attendanceDeductionPolicyReducer from "./attendance-deduction-policy-slice";
import presenceCheckReducer from "./presence-check-slice";
import expensesReducer from "./expenses-slice";
import shiftsReducer from "./shifts-slice";
import benefitPlansReducer from "./benefit-plans-slice";
import docuSignReducer from "./docu-sign-slice";
import myDocumentsReducer from "./my-documents-slice";
import erCasesReducer from "./er-cases-slice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    session: sessionReducer,
    onboarding: onboardingReducer,
    onboardingRecords: onboardingRecordsReducer,
    locale: localeReducer,
    branch: branchReducer,
    auth: authReducer,
    accessLevels: accessLevelsReducer,
    approvals: approvalsReducer,
    recruitment: recruitmentReducer,
    workforceRequests: workforceRequestsReducer,
    requisitions: requisitionsReducer,
    profileEdits: profileEditsReducer,
    collectionEdits: collectionEditsReducer,
    workflows: workflowsReducer,
    workflowRuns: workflowRunsReducer,
    scenarios: scenariosReducer,
    users: usersReducer,
    audit: auditReducer,
    diversity: diversityReducer,
    projects: projectsReducer,
    leave: leaveReducer,
    notifications: notificationsReducer,
    employees: employeesReducer,
    offboarding: offboardingReducer,
    attendance: attendanceReducer,
    attendanceDeductionPolicy: attendanceDeductionPolicyReducer,
    presenceCheck: presenceCheckReducer,
    expenses: expensesReducer,
    shifts: shiftsReducer,
    benefitPlans: benefitPlansReducer,
    docuSign: docuSignReducer,
    myDocuments: myDocumentsReducer,
    erCases: erCasesReducer,
  },
  // Prepend, never replace: replacing the stack drops serialisability and
  // immutability checks along with thunk support.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    })
      .prepend(
        workflowRunsListener.middleware,
        profileEditsListener.middleware,
        offboardingListener.middleware,
        leaveListener.middleware,
      )
      .concat(api.middleware),
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
