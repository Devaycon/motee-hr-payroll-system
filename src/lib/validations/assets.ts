import { z } from "zod";

export const assetSchema = z.object({
  tag: z.string().trim().min(1, { message: "Asset tag is required" }),
  name: z.string().trim().min(1, { message: "Asset name is required" }),
  category: z.string().trim().nullable().optional(),
  serialNumber: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  assignedDate: z.string().nullable().optional(),
});

export type AssetFormType = z.infer<typeof assetSchema>;

export const assignAssetSchema = z.object({
  employeeId: z.string().uuid({ message: "Choose who the asset is going to" }),
  assignedDate: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
});

export type AssignAssetFormType = z.infer<typeof assignAssetSchema>;
