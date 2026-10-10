import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(1, { message: "Department name is required" }),
  code: z
    .string()
    .trim()
    .min(1, { message: "Department code is required" })
    .max(10, { message: "Code must be 10 characters or fewer" }),
  description: z.string().trim().nullable().optional(),
  headEmployeeId: z.string().uuid().nullable().optional(),
  businessUnitId: z.string().uuid().nullable().optional(),
  budgetMonthly: z
    .number()
    .nonnegative({ message: "Budget cannot be negative" })
    .nullable()
    .optional(),
  status: z.enum(["active", "inactive", "restructuring"]).optional(),
});

export type DepartmentFormType = z.infer<typeof departmentSchema>;

export const businessUnitSchema = z.object({
  name: z.string().trim().min(1, { message: "Business unit name is required" }),
  code: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type BusinessUnitFormType = z.infer<typeof businessUnitSchema>;
