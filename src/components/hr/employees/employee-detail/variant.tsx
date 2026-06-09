"use client";

import { createContext, useContext } from "react";

/**
 * Controls how the shared employee-detail modules behave:
 * - `hr` view edits the record directly and reviews change requests.
 * - `self` view (My Profile) submits change requests for HR approval.
 */
export interface ProfileVariant {
  mode: "edit" | "request";
  audience: "hr" | "employee";
}

const DEFAULT_VARIANT: ProfileVariant = { mode: "edit", audience: "hr" };

const ProfileVariantContext = createContext<ProfileVariant>(DEFAULT_VARIANT);

export const ProfileVariantProvider = ProfileVariantContext.Provider;

export function useProfileVariant(): ProfileVariant {
  return useContext(ProfileVariantContext);
}
