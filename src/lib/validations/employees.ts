import { z } from "zod";

const employmentType = z.enum([
  "fullTime",
  "partTime",
  "temporary",
  "contract",
  "freelance",
  "internship",
  "apprenticeship",
  "casual",
  "seasonal",
  "remote",
  "fieldBased",
]);

const email = z
  .string()
  .trim()
  .min(1, { message: "Email address is required" })
  .email({ message: "Enter a valid email address" });

/** The fields the API insists on; everything else on the record is optional. */
const identity = {
  firstName: z.string().trim().min(1, { message: "First name is required" }),
  lastName: z.string().trim().min(1, { message: "Last name is required" }),
  email,
  jobTitle: z.string().trim().min(1, { message: "Job title is required" }),
};

export const employeeSchema = z
  .object({
    ...identity,
    departmentId: z
      .string()
      .uuid({ message: "Choose a department that exists in Departments" }),
    employmentType,
  })
  .passthrough();

export const inviteEmployeeSchema = z.object({
  ...identity,
  middleName: z.string().trim().nullable().optional(),
  departmentId: z
    .string()
    .uuid({ message: "Choose a department that exists in Departments" }),
  employmentType,
  startDate: z.string().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
});

export type InviteEmployeeFormType = z.infer<typeof inviteEmployeeSchema>;

export const importRowSchema = z
  .object({
    ...identity,
    department: z.string().trim().min(1, { message: "Department is required" }),
  })
  .passthrough();
