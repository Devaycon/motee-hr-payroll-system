import { z } from "zod";

export const offboardingSchema = z.object({
  employeeId: z
    .string({ message: "Choose the employee who is leaving" })
    .uuid({ message: "Choose the employee who is leaving" }),
  exitReason: z.enum([
    "resignation",
    "termination",
    "redundancy",
    "retirement",
    "contractEnd",
    "other",
  ]),
  lastWorkingDate: z
    .string()
    .min(1, { message: "Last working date is required" }),
  notes: z.string().trim().nullable().optional(),
});

export type OffboardingFormType = z.infer<typeof offboardingSchema>;
