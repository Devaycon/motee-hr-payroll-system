import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  OnboardingState,
  CompanyProfile,
  OrganizationConfig,
  AccessControlConfig,
  WorkflowConfig,
  UILabels,
  CompanySetup,
  DEFAULT_COMPANY_SETUP,
} from "@/src/lib/types/onboarding-setup.types";

const initialState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  companySetup: DEFAULT_COMPANY_SETUP,
  isBulkUploaded: false,
  isSubmitting: false,
  isComplete: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },
    markStepComplete(state, action: PayloadAction<number>) {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    updateCompanyProfile(state, action: PayloadAction<Partial<CompanyProfile>>) {
      state.companySetup.companyProfile = {
        ...state.companySetup.companyProfile,
        ...action.payload,
      };
    },
    updateOrganizationConfig(state, action: PayloadAction<Partial<OrganizationConfig>>) {
      state.companySetup.organizationConfig = {
        ...state.companySetup.organizationConfig,
        ...action.payload,
      };
    },
    updateAccessControlConfig(state, action: PayloadAction<Partial<AccessControlConfig>>) {
      state.companySetup.accessControlConfig = {
        ...state.companySetup.accessControlConfig,
        ...action.payload,
      };
    },
    updateEnabledModules(state, action: PayloadAction<string[]>) {
      state.companySetup.enabledModules = action.payload;
    },
    updateWorkflowConfig(state, action: PayloadAction<Partial<WorkflowConfig>>) {
      state.companySetup.workflowConfig = {
        ...state.companySetup.workflowConfig,
        ...action.payload,
      };
    },
    updateUILabels(state, action: PayloadAction<Partial<UILabels>>) {
      const incoming = action.payload;
      for (const key in incoming) {
        const val = incoming[key];
        if (val !== undefined) {
          state.companySetup.uiLabels[key] = val;
        }
      }
    },
    prefillFromUpload(state, action: PayloadAction<Partial<CompanySetup>>) {
      const uploaded = action.payload;
      if (uploaded.companyProfile) {
        state.companySetup.companyProfile = {
          ...state.companySetup.companyProfile,
          ...uploaded.companyProfile,
        };
      }
      if (uploaded.organizationConfig) {
        state.companySetup.organizationConfig = {
          ...state.companySetup.organizationConfig,
          ...uploaded.organizationConfig,
        };
      }
      if (uploaded.accessControlConfig) {
        state.companySetup.accessControlConfig = {
          ...state.companySetup.accessControlConfig,
          ...uploaded.accessControlConfig,
        };
      }
      if (uploaded.enabledModules) {
        state.companySetup.enabledModules = uploaded.enabledModules;
      }
      if (uploaded.workflowConfig) {
        state.companySetup.workflowConfig = {
          ...state.companySetup.workflowConfig,
          ...uploaded.workflowConfig,
        };
      }
      if (uploaded.uiLabels) {
        for (const key in uploaded.uiLabels) {
          const val = uploaded.uiLabels[key];
          if (val !== undefined) {
            state.companySetup.uiLabels[key] = val;
          }
        }
      }
      state.isBulkUploaded = true;
    },
    setIsSubmitting(state, action: PayloadAction<boolean>) {
      state.isSubmitting = action.payload;
    },
    setIsComplete(state, action: PayloadAction<boolean>) {
      state.isComplete = action.payload;
    },
    resetOnboarding() {
      return initialState;
    },
  },
});

export const {
  setCurrentStep,
  markStepComplete,
  updateCompanyProfile,
  updateOrganizationConfig,
  updateAccessControlConfig,
  updateEnabledModules,
  updateWorkflowConfig,
  updateUILabels,
  prefillFromUpload,
  setIsSubmitting,
  setIsComplete,
  resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
