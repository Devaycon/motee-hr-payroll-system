import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Verify Email — Motee Solutions",
  description: "Verify your email address to activate your Motee account",
};

const VerifyOtpIndex = dynamic(
  () => import("@/src/components/auth/verify-otp"),
);

export default function VerifyOtpPage() {
  return <VerifyOtpIndex />;
}
