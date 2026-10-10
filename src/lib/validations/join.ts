import { z } from "zod";

export const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
    phone: z.string().trim().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().trim().optional(),
    emergencyContactName: z.string().trim().optional(),
    emergencyContactPhone: z.string().trim().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormType = z.infer<typeof acceptInviteSchema>;

export const joinGuarantorsSchema = z.object({
  guarantors: z.array(
    z.object({
      position: z.number().int().positive(),
      name: z.string().trim().min(2, { message: "Each guarantor needs a name" }),
      relationship: z
        .string()
        .trim()
        .min(2, { message: "Say how each guarantor is related to you" }),
      occupation: z.string().trim().nullable().optional(),
      address: z.string().trim().nullable().optional(),
      phone: z.string().trim().nullable().optional(),
    }),
  ),
});

export const joinP45Schema = z.object({
  leavingDate: z
    .string()
    .min(1, { message: "Enter the leaving date shown on your P45" }),
  taxCodeAtLeaving: z
    .string()
    .trim()
    .min(1, { message: "Enter the tax code shown on your P45" }),
  totalPayToDate: z.number().nonnegative().optional(),
  totalTaxToDate: z.number().nonnegative().optional(),
});

export const joinDeclarationSchema = z.object({
  signedName: z
    .string()
    .trim()
    .min(3, { message: "Type your full name to sign the declaration" }),
});
