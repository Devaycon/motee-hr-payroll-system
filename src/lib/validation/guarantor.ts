import { z } from "zod";

/** Shared between the self-service wizard and the HR-manual onboarding form. */
export const guarantorSchema = z.object({
  name: z.string().trim().min(2, "Required"),
  relationship: z.string().trim().min(2, "Required"),
  address: z.string().trim().min(5, "At least 5 characters"),
  phone: z.string().trim().min(7, "At least 7 digits"),
  occupation: z.string().trim().min(2, "Required"),
});

/** Always required for NG joiners — exactly 2 guarantors. */
export const guarantorsSchema = z.object({
  guarantors: z.array(guarantorSchema).length(2),
});

export function emptyGuarantor() {
  return { name: "", relationship: "", address: "", phone: "", occupation: "" };
}
