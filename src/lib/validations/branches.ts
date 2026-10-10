import { z } from "zod";

const optionalText = z.string().trim().nullable().optional();

export const branchSchema = z.object({
  name: z.string().trim().min(1, { message: "Branch name is required" }),
  code: z.string().trim().min(1, { message: "Branch code is required" }),
  kind: z
    .enum(["headquarters", "branch", "regionalOffice", "site", "remote"])
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
  addressLines: z.array(z.string()).optional(),
  city: optionalText,
  region: optionalText,
  postalCode: optionalText,
  country: optionalText,
  timeZone: optionalText,
  phone: optionalText,
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid branch email address" })
    .nullable()
    .optional(),
  managerEmployeeId: z.string().uuid().nullable().optional(),
  headcountTarget: z
    .number()
    .int()
    .nonnegative({ message: "Headcount target cannot be negative" })
    .nullable()
    .optional(),
  openedAt: optionalText,
});

export type BranchFormType = z.infer<typeof branchSchema>;
