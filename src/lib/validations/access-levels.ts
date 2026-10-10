import { z } from "zod";

const permissionAction = z.enum([
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "approve",
  "administer",
]);

export const accessLevelSchema = z.object({
  name: z.string().trim().min(1, { message: "Role name is required" }),
  description: z.string().trim().nullable().optional(),
  scope: z.object({
    kind: z.enum([
      "none",
      "self",
      "directReports",
      "ownDepartment",
      "department",
      "ownBranch",
      "branch",
      "businessUnit",
      "all",
    ]),
    departmentIds: z.array(z.string()).optional(),
    businessUnitIds: z.array(z.string()).optional(),
    branchIds: z.array(z.string()).optional(),
  }),
  permissions: z
    .array(
      z.object({
        module: z.string().min(1),
        access: z.boolean(),
        actions: z.array(permissionAction),
      }),
    )
    .min(1, { message: "Grant at least one module" }),
  copyFromId: z.string().nullable().optional(),
});

export type AccessLevelFormType = z.infer<typeof accessLevelSchema>;
