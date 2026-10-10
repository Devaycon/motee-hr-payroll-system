import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, { message: "Email address is required" })
  .email({ message: "Please enter a valid email address" });

const newPassword = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" });

export const OTP_LENGTH = 6;

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginFormType = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { message: "First name must be at least 2 characters" }),
    middleName: z.string().trim().optional(),
    lastName: z
      .string()
      .trim()
      .min(2, { message: "Last name must be at least 2 characters" }),
    email,
    companyName: z
      .string()
      .trim()
      .min(2, { message: "Company name must be at least 2 characters" }),
    countryCode: z.string().min(1, { message: "Select a country" }),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormType = z.infer<typeof registerFormSchema>;

export const otpSchema = z.object({
  email,
  code: z
    .string()
    .length(OTP_LENGTH, { message: `Enter the ${OTP_LENGTH}-digit code` }),
});

export type OtpFormType = z.infer<typeof otpSchema>;

export const forgotPasswordSchema = z.object({ email });

export type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormType = z.infer<typeof resetPasswordSchema>;
