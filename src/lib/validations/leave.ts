import { z } from "zod";

const isoDate = z.string().min(1, { message: "Choose a date" });

export const leaveRequestSchema = z
  .object({
    employeeId: z
      .string({ message: "Choose who the leave is for" })
      .uuid({ message: "Choose who the leave is for" }),
    leaveTypeId: z
      .string({ message: "That leave type is not set up yet" })
      .uuid({ message: "That leave type is not set up yet" }),
    startDate: isoDate,
    endDate: isoDate,
    isHalfDay: z.boolean().optional(),
    halfDayPeriod: z.string().nullable().optional(),
    reason: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
    reliefEmployeeId: z.string().uuid().nullable().optional(),
    fileIds: z.array(z.string().uuid()).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "The end date cannot be before the start date",
    path: ["endDate"],
  });

export type LeaveRequestFormType = z.infer<typeof leaveRequestSchema>;

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(1, { message: "Leave type name is required" }),
  isPaid: z.boolean().optional(),
  isActive: z.boolean().optional(),
  policy: z
    .object({
      daysPerYear: z
        .number()
        .nonnegative({ message: "Days per year cannot be negative" }),
    })
    .passthrough(),
});

export const publicHolidaySchema = z.object({
  date: isoDate,
  name: z.string().trim().min(1, { message: "Holiday name is required" }),
  countryCode: z.string().nullable().optional(),
});

export type PublicHolidayFormType = z.infer<typeof publicHolidaySchema>;

export const leaveBlackoutSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Give the blackout a name" }),
    reason: z.string().trim().nullable().optional(),
    startDate: isoDate,
    endDate: isoDate,
    leaveTypeIds: z
      .array(z.string().uuid())
      .min(1, { message: "Choose at least one leave type" }),
    departmentIds: z.array(z.string().uuid()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "The end date cannot be before the start date",
    path: ["endDate"],
  });

export type LeaveBlackoutFormType = z.infer<typeof leaveBlackoutSchema>;

export const leaveAdjustmentSchema = z.object({
  employeeId: z.string().uuid(),
  leaveTypeId: z.string().uuid(),
  days: z.number().refine((d) => d !== 0, { message: "Enter a non-zero amount" }),
  reason: z.string().trim().min(1, { message: "A reason is required" }),
});
