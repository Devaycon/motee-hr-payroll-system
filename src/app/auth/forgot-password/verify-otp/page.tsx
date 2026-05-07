import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Verify Reset Code — Motee Solutions",
  description: "Enter your password reset code",
};

const ForgotPasswordVerifyOtpIndex = dynamic(
  () => import("@/src/components/auth/forgot-password-verify-otp"),
);

export default function ForgotPasswordVerifyOtpPage() {
  return <ForgotPasswordVerifyOtpIndex />;
}
