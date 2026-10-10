import { z } from "zod";

export const approvalTemplateSchema = z.object({
  documentType: z
    .string()
    .trim()
    .min(1, { message: "Choose what this chain approves" }),
  name: z.string().trim().min(1, { message: "Give the chain a name" }),
  description: z.string().trim().nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  steps: z
    .array(
      z
        .object({
          label: z.string().trim().min(1, { message: "Every step needs a name" }),
          approver: z.enum(["lineManager", "departmentHead", "role"]),
          roleId: z.string().uuid().nullable().optional(),
          required: z.boolean().optional(),
        })
        .refine((step) => step.approver !== "role" || Boolean(step.roleId), {
          message: "Choose the role that approves this step",
          path: ["roleId"],
        }),
    )
    .min(1, { message: "Add at least one approval step" }),
});

export type ApprovalTemplateFormType = z.infer<typeof approvalTemplateSchema>;

export const approvalDelegationSchema = z
  .object({
    delegateEmployeeId: z
      .string({ message: "Choose who covers your approvals" })
      .uuid({ message: "Choose who covers your approvals" }),
    startDate: z.string().min(1, { message: "Choose a start date" }),
    endDate: z.string().min(1, { message: "Choose an end date" }),
    reason: z.string().trim().nullable().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "The end date cannot be before the start date",
    path: ["endDate"],
  });

export type ApprovalDelegationFormType = z.infer<
  typeof approvalDelegationSchema
>;

export const approvalDecisionSchema = z
  .object({
    decision: z.enum(["approved", "rejected", "returned"]),
    note: z.string().trim().nullable().optional(),
  })
  .refine((v) => v.decision === "approved" || Boolean(v.note), {
    message: "Say why, so the requester knows what to change",
    path: ["note"],
  });
