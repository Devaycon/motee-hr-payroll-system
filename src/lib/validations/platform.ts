import { z } from "zod";

export const platformStaffSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email address is required" })
    .email({ message: "Enter a valid email address" }),
  role: z.enum(["support", "finance", "admin"]),
});

export type PlatformStaffFormType = z.infer<typeof platformStaffSchema>;
