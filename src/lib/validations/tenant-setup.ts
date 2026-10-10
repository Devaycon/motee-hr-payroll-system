import { z } from "zod";

/** What `PUT /tenant/setup` accepts, checked once the wizard reaches review. */
export const tenantSetupSchema = z.object({
  industry: z.string().min(1, { message: "Select an industry" }),
  companySize: z.string().min(1, { message: "Select a company size" }),
  companyEmailDomain: z.string().trim().nullable(),
  companyPolicies: z.string().trim().nullable(),
  managerTitle: z.string().trim().min(1, { message: "Manager title is required" }),
  departmentLabel: z
    .string()
    .trim()
    .min(1, { message: "Department label is required" }),
  structureType: z.enum(["hierarchical", "flat"], {
    message: "Choose a hierarchical or flat structure",
  }),
  enabledModules: z
    .array(z.string())
    .min(1, { message: "Enable at least one module" }),
});

export type TenantSetupFormType = z.infer<typeof tenantSetupSchema>;
